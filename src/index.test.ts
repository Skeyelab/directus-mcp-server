import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { schemaTools } from './tools/schema-tools.js';
import { contentTools } from './tools/content-tools.js';
import { flowTools } from './tools/flow-tools.js';
import { Toolset } from './types/index.js';

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

  describe('Toolset Support', () => {
    const allTools = [...schemaTools, ...contentTools, ...flowTools];

    it('should have collections, fields, relations, and content tools assigned to default toolset', () => {
      // Schema snapshot/diff tools are NOT in default, only collections/fields/relations/content are
      const defaultTools = [
        ...schemaTools.filter(t => !['get_schema_snapshot', 'get_schema_diff', 'apply_schema_diff'].includes(t.name)),
        ...contentTools
      ];
      defaultTools.forEach((tool) => {
        expect(tool.toolsets).toContain('default');
      });
    });

    it('should have schema tools assigned to appropriate toolsets', () => {
      schemaTools.forEach((tool) => {
        // Collections tools should have 'collections' and 'default' toolsets
        if (['list_collections', 'get_collection', 'create_collection', 'update_collection', 'delete_collection'].includes(tool.name)) {
          expect(tool.toolsets).toContain('collections');
          expect(tool.toolsets).toContain('default');
        }
        // Fields tools should have 'fields' and 'default' toolsets
        if (['list_fields', 'create_field', 'update_field', 'delete_field'].includes(tool.name)) {
          expect(tool.toolsets).toContain('fields');
          expect(tool.toolsets).toContain('default');
        }
        // Relations tools should have 'relations' and 'default' toolsets
        if (['list_relations', 'create_relation', 'delete_relation'].includes(tool.name)) {
          expect(tool.toolsets).toContain('relations');
          expect(tool.toolsets).toContain('default');
        }
        // Schema snapshot/diff tools should have 'schema' toolset only (NOT in default)
        if (['get_schema_snapshot', 'get_schema_diff', 'apply_schema_diff'].includes(tool.name)) {
          expect(tool.toolsets).toContain('schema');
          expect(tool.toolsets).not.toContain('default');
        }
      });
    });

    it('should have content tools assigned to content toolset', () => {
      contentTools.forEach((tool) => {
        expect(tool.toolsets).toContain('content');
        expect(tool.toolsets).toContain('default');
      });
    });

    it('should have flow tools assigned to flow toolset only (not default)', () => {
      flowTools.forEach((tool) => {
        expect(tool.toolsets).toContain('flow');
        expect(tool.toolsets).not.toContain('default');
      });
    });

    it('should have valid toolset values', () => {
      const validToolsets: Toolset[] = ['default', 'schema', 'content', 'flow', 'collections', 'fields', 'relations'];
      allTools.forEach((tool) => {
        if (tool.toolsets) {
          tool.toolsets.forEach((toolset) => {
            expect(validToolsets).toContain(toolset);
          });
        }
      });
    });
  });

  describe('Toolset Filtering Logic', () => {
    const allTools = [...schemaTools, ...contentTools, ...flowTools];

    function parseToolsets(envValue: string | undefined): Toolset[] {
      if (!envValue || envValue.trim() === '') {
        return ['default'];
      }

      const requestedToolsets = envValue
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const validToolsets: Toolset[] = ['default', 'schema', 'content', 'flow', 'collections', 'fields', 'relations'];
      const filtered = requestedToolsets.filter((t) =>
        validToolsets.includes(t as Toolset)
      ) as Toolset[];

      if (filtered.length === 0) {
        return ['default'];
      }

      return filtered;
    }

    function filterToolsByToolsets(
      tools: typeof allTools,
      toolsets: Toolset[]
    ) {
      return tools.filter((tool) => {
        return tool.toolsets?.some((toolset) => toolsets.includes(toolset)) ?? false;
      });
    }

    describe('parseToolsets', () => {
      it('should return default toolset when env value is undefined', () => {
        expect(parseToolsets(undefined)).toEqual(['default']);
      });

      it('should return default toolset when env value is empty string', () => {
        expect(parseToolsets('')).toEqual(['default']);
        expect(parseToolsets('   ')).toEqual(['default']);
      });

      it('should parse single toolset', () => {
        expect(parseToolsets('schema')).toEqual(['schema']);
        expect(parseToolsets('content')).toEqual(['content']);
        expect(parseToolsets('flow')).toEqual(['flow']);
        expect(parseToolsets('default')).toEqual(['default']);
        expect(parseToolsets('collections')).toEqual(['collections']);
        expect(parseToolsets('fields')).toEqual(['fields']);
        expect(parseToolsets('relations')).toEqual(['relations']);
      });

      it('should parse multiple toolsets', () => {
        expect(parseToolsets('schema,content')).toEqual(['schema', 'content']);
        expect(parseToolsets('default,flow')).toEqual(['default', 'flow']);
        expect(parseToolsets('schema,content,flow')).toEqual(['schema', 'content', 'flow']);
        expect(parseToolsets('collections,fields,relations')).toEqual(['collections', 'fields', 'relations']);
      });

      it('should handle whitespace in toolset list', () => {
        expect(parseToolsets('schema , content')).toEqual(['schema', 'content']);
        expect(parseToolsets('  schema  ,  content  ')).toEqual(['schema', 'content']);
      });

      it('should be case insensitive', () => {
        expect(parseToolsets('SCHEMA')).toEqual(['schema']);
        expect(parseToolsets('Schema,Content')).toEqual(['schema', 'content']);
      });

      it('should filter out invalid toolset names', () => {
        expect(parseToolsets('schema,invalid,content')).toEqual(['schema', 'content']);
        expect(parseToolsets('invalid1,invalid2')).toEqual(['default']);
      });

      it('should return default when all toolsets are invalid', () => {
        expect(parseToolsets('invalid1,invalid2')).toEqual(['default']);
      });
    });

    describe('filterToolsByToolsets', () => {
      it('should return collections, fields, relations, and content tools (but not schema or flow tools) when filtering by default toolset', () => {
        const filtered = filterToolsByToolsets(allTools, ['default']);
        // Schema snapshot/diff tools (3) are NOT in default, so subtract them
        const defaultSchemaTools = schemaTools.length - 3;
        expect(filtered.length).toBe(defaultSchemaTools + contentTools.length);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('default');
          expect(tool.toolsets).not.toContain('flow');
          expect(tool.toolsets).not.toContain('schema');
        });
      });

      it('should return only schema snapshot/diff tools when filtering by schema toolset', () => {
        const filtered = filterToolsByToolsets(allTools, ['schema']);
        // Only 3 tools have 'schema' toolset: get_schema_snapshot, get_schema_diff, apply_schema_diff
        expect(filtered.length).toBe(3);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('schema');
        });
      });

      it('should return only content tools when filtering by content toolset', () => {
        const filtered = filterToolsByToolsets(allTools, ['content']);
        expect(filtered.length).toBe(contentTools.length);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('content');
        });
      });

      it('should return only flow tools when filtering by flow toolset', () => {
        const filtered = filterToolsByToolsets(allTools, ['flow']);
        expect(filtered.length).toBe(flowTools.length);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('flow');
        });
      });

      it('should return only collections tools when filtering by collections toolset', () => {
        const filtered = filterToolsByToolsets(allTools, ['collections']);
        // 5 collection tools: list_collections, get_collection, create_collection, update_collection, delete_collection
        expect(filtered.length).toBe(5);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('collections');
        });
      });

      it('should return only fields tools when filtering by fields toolset', () => {
        const filtered = filterToolsByToolsets(allTools, ['fields']);
        // 4 field tools: list_fields, create_field, update_field, delete_field
        expect(filtered.length).toBe(4);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('fields');
        });
      });

      it('should return only relations tools when filtering by relations toolset', () => {
        const filtered = filterToolsByToolsets(allTools, ['relations']);
        // 3 relation tools: list_relations, create_relation, delete_relation
        expect(filtered.length).toBe(3);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('relations');
        });
      });

      it('should return tools from multiple toolsets', () => {
        const filtered = filterToolsByToolsets(allTools, [
          'schema',
          'content',
        ] as Toolset[]);
        // Schema toolset has 3 tools, content has all contentTools
        const schemaSnapshotTools = schemaTools.filter(t => (t.toolsets as readonly Toolset[]).includes('schema'));
        expect(filtered.length).toBe(schemaSnapshotTools.length + contentTools.length);
        filtered.forEach((tool) => {
          const toolToolsets = tool.toolsets as readonly Toolset[];
          expect(
            toolToolsets.includes('schema') || toolToolsets.includes('content')
          ).toBe(true);
        });
      });

      it('should not return duplicate tools when multiple toolsets are specified', () => {
        const filtered = filterToolsByToolsets(allTools, ['default', 'schema']);
        const toolNames = filtered.map((t) => t.name);
        const uniqueNames = new Set(toolNames);
        expect(toolNames.length).toBe(uniqueNames.size);
      });

      it('should return empty array when filtering by non-existent toolset', () => {
        // This shouldn't happen with valid toolsets, but test the behavior
        const filtered = filterToolsByToolsets(allTools, [] as Toolset[]);
        expect(filtered.length).toBe(0);
      });
    });

    describe('Default Behavior', () => {
      it('should expose collections, fields, relations, and content tools (but not schema or flow tools) when no toolset is specified (default toolset)', () => {
        const toolsets = parseToolsets(undefined);
        const filtered = filterToolsByToolsets(allTools, toolsets);
        // Schema snapshot/diff tools (3) are NOT in default
        const defaultSchemaTools = schemaTools.length - 3;
        expect(filtered.length).toBe(defaultSchemaTools + contentTools.length);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('default');
          expect(tool.toolsets).not.toContain('schema');
          expect(tool.toolsets).not.toContain('flow');
        });
      });

      it('should expose only default tools (collections, fields, relations, content, not schema or flow) when default toolset is explicitly requested', () => {
        const toolsets = parseToolsets('default');
        const filtered = filterToolsByToolsets(allTools, toolsets);
        // Schema snapshot/diff tools (3) are NOT in default
        const defaultSchemaTools = schemaTools.length - 3;
        expect(filtered.length).toBe(defaultSchemaTools + contentTools.length);
        filtered.forEach((tool) => {
          expect(tool.toolsets).toContain('default');
          expect(tool.toolsets).not.toContain('flow');
          expect(tool.toolsets).not.toContain('schema');
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty toolset string', () => {
        const toolsets = parseToolsets('');
        expect(toolsets).toEqual(['default']);
      });

      it('should handle comma-only string', () => {
        const toolsets = parseToolsets(',,');
        expect(toolsets).toEqual(['default']);
      });

      it('should handle mixed valid and invalid toolsets', () => {
        const toolsets = parseToolsets('schema,invalid,content,also-invalid');
        expect(toolsets).toEqual(['schema', 'content']);
      });

      it('should handle toolsets with special characters', () => {
        const toolsets = parseToolsets('schema@invalid,content');
        expect(toolsets).toEqual(['content']);
      });
    });
  });
});

