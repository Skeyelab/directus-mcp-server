import { z } from 'zod';
import { DirectusClient } from '../directus-client.js';
import { Toolset, MCPTool } from '../types/index.js';

/**
 * Creates a standardized MCP tool with consistent response formatting
 */
export function createTool<T extends z.ZodType<any, any>>(config: {
  name: string;
  description: string;
  inputSchema: T;
  toolsets: Toolset[];
  handler: (client: DirectusClient, args: z.infer<T>) => Promise<any>;
}): MCPTool {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    toolsets: config.toolsets,
    handler: async (client: DirectusClient, args: any) => {
      const result = await config.handler(client, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  };
}

/**
 * Creates a simple action tool that returns a success message
 */
export function createActionTool<T extends z.ZodType<any, any>>(config: {
  name: string;
  description: string;
  inputSchema: T;
  toolsets: Toolset[];
  handler: (client: DirectusClient, args: z.infer<T>) => Promise<void>;
  successMessage: (args: z.infer<T>) => string;
}): MCPTool {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    toolsets: config.toolsets,
    handler: async (client: DirectusClient, args: any) => {
      await config.handler(client, args);
      return {
        content: [
          {
            type: 'text',
            text: config.successMessage(args),
          },
        ],
      };
    },
  };
}
