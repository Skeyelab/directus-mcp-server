#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { createDirectusClient, DirectusClient } from './directus-client.js';
import { schemaTools } from './tools/schema-tools.js';
import { contentTools } from './tools/content-tools.js';
import { flowTools } from './tools/flow-tools.js';
import { operationTools } from './tools/operation-tools.js';
import { Toolset } from './types/index.js';

// Load environment variables
dotenv.config();

// Validate configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

if (!DIRECTUS_URL) {
  console.error('Error: DIRECTUS_URL environment variable is required');
  process.exit(1);
}

if (!DIRECTUS_TOKEN && (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD)) {
  console.error('Error: Either DIRECTUS_TOKEN or DIRECTUS_EMAIL/DIRECTUS_PASSWORD must be provided');
  process.exit(1);
}

// Combine all tools
const allTools = [...schemaTools, ...contentTools, ...flowTools, ...operationTools];

// Parse and filter tools based on MCP_TOOLSETS environment variable
function parseToolsets(envValue: string | undefined): Toolset[] {
  if (!envValue || envValue.trim() === '') {
    // Default behavior: only expose 'default' toolset
    return ['default'];
  }

  const requestedToolsets = envValue
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  // Validate toolset names (ignore invalid ones)
  const validToolsets: Toolset[] = ['default', 'schema', 'content', 'flow', 'collections', 'fields', 'relations'];
  const filtered = requestedToolsets.filter((t) =>
    validToolsets.includes(t as Toolset)
  ) as Toolset[];

  if (filtered.length === 0) {
    // If all requested toolsets are invalid, default to 'default'
    console.error(
      `Warning: No valid toolsets found in MCP_TOOLSETS="${envValue}". Defaulting to 'default' toolset.`
    );
    return ['default'];
  }

  // Warn about invalid toolset names
  const invalid = requestedToolsets.filter(
    (t) => !validToolsets.includes(t as Toolset)
  );
  if (invalid.length > 0) {
    console.error(
      `Warning: Invalid toolset names ignored: ${invalid.join(', ')}. Valid toolsets are: ${validToolsets.join(', ')}`
    );
  }

  return filtered;
}

function filterToolsByToolsets(tools: typeof allTools, toolsets: Toolset[]) {
  return tools.filter((tool) => {
    // Tool must belong to at least one of the requested toolsets
    return tool.toolsets?.some((toolset) => toolsets.includes(toolset)) ?? false;
  });
}

// Get enabled toolsets from environment
const enabledToolsets = parseToolsets(process.env.MCP_TOOLSETS);
const enabledTools = filterToolsByToolsets(allTools, enabledToolsets);

// Initialize Directus client
let directusClient: DirectusClient;

async function initializeClient() {
  try {
    directusClient = await createDirectusClient({
      url: DIRECTUS_URL!,
      token: DIRECTUS_TOKEN,
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD,
    });
    console.error('Successfully connected to Directus instance');
  } catch (error) {
    console.error('Failed to initialize Directus client:', error);
    throw error;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'directus-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: enabledTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: tool.inputSchema.shape
          ? Object.entries(tool.inputSchema.shape).reduce((acc, [key, value]: [string, any]) => {
              acc[key] = {
                type: getZodType(value),
                description: value.description || '',
                ...(value._def?.typeName === 'ZodOptional' ? {} : {}),
              };
              return acc;
            }, {} as Record<string, any>)
          : {},
        required: tool.inputSchema.shape
          ? Object.entries(tool.inputSchema.shape)
              .filter(([_, value]: [string, any]) => value._def?.typeName !== 'ZodOptional')
              .map(([key]) => key)
          : [],
      },
    })),
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = enabledTools.find((t) => t.name === name);
  if (!tool) {
    // Check if tool exists but is not in enabled toolsets
    const toolExists = allTools.find((t) => t.name === name);
    if (toolExists && toolExists.toolsets) {
      throw new Error(
        `Tool "${name}" is not available. It belongs to toolsets: ${toolExists.toolsets.join(', ')}. Enabled toolsets: ${enabledToolsets.join(', ')}`
      );
    }
    throw new Error(`Tool not found: ${name}`);
  }

  try {
    // Validate arguments
    const validatedArgs = tool.inputSchema.parse(args);

    // Execute tool
    const result = await tool.handler(directusClient, validatedArgs);

    return result;
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      throw new Error(`Invalid arguments: ${error.errors.map((e: any) => e.message).join(', ')}`);
    }

    // Handle other errors
    throw new Error(`Tool execution failed: ${error.message}`);
  }
});

// Helper function to convert Zod types to JSON Schema types
export function getZodType(zodSchema: any): string {
  const typeName = zodSchema._def?.typeName;

  switch (typeName) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodArray':
      return 'array';
    case 'ZodObject':
      return 'object';
    case 'ZodOptional':
      return getZodType(zodSchema._def.innerType);
    case 'ZodUnion':
      return getZodType(zodSchema._def.options[0]);
    case 'ZodRecord':
      return 'object';
    default:
      return 'string';
  }
}

// Start server
async function main() {
  try {
    // Initialize Directus client first
    await initializeClient();

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Directus MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

