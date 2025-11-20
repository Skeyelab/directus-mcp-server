import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { schemaTools } from './tools/schema-tools.js';
import { contentTools } from './tools/content-tools.js';
import { flowTools } from './tools/flow-tools.js';

// Import getZodType directly to avoid executing index.ts
// We'll test it by recreating the function logic
function getZodType(zodSchema: any): string {
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

describe('Index Helper Functions', () => {
  describe('getZodType', () => {
    it('should return "string" for ZodString', () => {
      expect(getZodType(z.string())).toBe('string');
    });

    it('should return "number" for ZodNumber', () => {
      expect(getZodType(z.number())).toBe('number');
    });

    it('should return "boolean" for ZodBoolean', () => {
      expect(getZodType(z.boolean())).toBe('boolean');
    });

    it('should return "array" for ZodArray', () => {
      expect(getZodType(z.array(z.string()))).toBe('array');
    });

    it('should return "object" for ZodObject', () => {
      expect(getZodType(z.object({}))).toBe('object');
    });

    it('should return "object" for ZodRecord', () => {
      expect(getZodType(z.record(z.string()))).toBe('object');
    });

    it('should unwrap ZodOptional and return inner type', () => {
      expect(getZodType(z.string().optional())).toBe('string');
      expect(getZodType(z.number().optional())).toBe('number');
    });

    it('should handle ZodUnion and return first option type', () => {
      expect(getZodType(z.union([z.string(), z.number()]))).toBe('string');
      expect(getZodType(z.union([z.number(), z.string()]))).toBe('number');
    });

    it('should default to "string" for unknown types', () => {
      expect(getZodType({ _def: { typeName: 'UnknownType' } })).toBe('string');
      expect(getZodType({})).toBe('string');
    });

    it('should handle nested optional types', () => {
      const schema = z.object({
        name: z.string().optional(),
        age: z.number().optional(),
      });
      const nameField = schema.shape.name;
      expect(getZodType(nameField)).toBe('string');
    });
  });

  describe('Tool Registration', () => {
    it('should have all tools registered', () => {
      const allTools = [...schemaTools, ...contentTools, ...flowTools];
      expect(allTools.length).toBeGreaterThan(0);
    });

    it('should have unique tool names', () => {
      const allTools = [...schemaTools, ...contentTools, ...flowTools];
      const names = allTools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });

    it('should have all tools with required properties', () => {
      const allTools = [...schemaTools, ...contentTools, ...flowTools];
      allTools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.handler).toBe('function');
      });
    });

    it('should have schema tools registered', () => {
      expect(schemaTools.length).toBeGreaterThan(0);
      expect(schemaTools.some((t) => t.name === 'list_collections')).toBe(true);
      expect(schemaTools.some((t) => t.name === 'create_collection')).toBe(true);
    });

    it('should have content tools registered', () => {
      expect(contentTools.length).toBeGreaterThan(0);
      expect(contentTools.some((t) => t.name === 'query_items')).toBe(true);
      expect(contentTools.some((t) => t.name === 'create_item')).toBe(true);
    });

    it('should have flow tools registered', () => {
      expect(flowTools.length).toBeGreaterThan(0);
      expect(flowTools.some((t) => t.name === 'list_flows')).toBe(true);
      expect(flowTools.some((t) => t.name === 'create_flow')).toBe(true);
    });
  });

  describe('Tool Input Schema Validation', () => {
    it('should validate tool schemas are valid Zod schemas', () => {
      const allTools = [...schemaTools, ...contentTools, ...flowTools];
      allTools.forEach((tool) => {
        // Try to parse empty object - should either succeed or throw ZodError
        try {
          tool.inputSchema.parse({});
        } catch (error: any) {
          expect(error.name).toBe('ZodError');
        }
      });
    });

    it('should handle tools with no required fields', () => {
      const listCollectionsTool = schemaTools.find((t) => t.name === 'list_collections');
      expect(listCollectionsTool).toBeDefined();
      expect(() => {
        listCollectionsTool!.inputSchema.parse({});
      }).not.toThrow();
    });

    it('should handle tools with required fields', () => {
      const getCollectionTool = schemaTools.find((t) => t.name === 'get_collection');
      expect(getCollectionTool).toBeDefined();
      expect(() => {
        getCollectionTool!.inputSchema.parse({ collection: 'test' });
      }).not.toThrow();
      expect(() => {
        getCollectionTool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('Tool Handler Signatures', () => {
    it('should have handlers that accept DirectusClient and args', async () => {
      const mockClient = {
        getCollections: vi.fn().mockResolvedValue({ data: [] }),
      } as any;

      const listCollectionsTool = schemaTools.find((t) => t.name === 'list_collections');
      expect(listCollectionsTool).toBeDefined();

      const result = await listCollectionsTool!.handler(mockClient, {});
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should return proper MCP tool result format', async () => {
      const mockClient = {
        getCollection: vi.fn().mockResolvedValue({ collection: 'test' }),
      } as any;

      const getCollectionTool = schemaTools.find((t) => t.name === 'get_collection');
      const result = await getCollectionTool!.handler(mockClient, {
        collection: 'test',
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0]).toHaveProperty('text');
      expect(result.content[0].type).toBe('text');
    });
  });
});

