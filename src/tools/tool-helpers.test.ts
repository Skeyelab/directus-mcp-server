import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { createTool, createActionTool } from './tool-helpers.js';
import { DirectusClient } from '../directus-client.js';

describe('Tool Helpers', () => {
  let mockClient: DirectusClient;

  beforeEach(() => {
    mockClient = {
      request: vi.fn(),
      getCollections: vi.fn(),
    } as any;
  });

  describe('createTool', () => {
    const TestSchema = z.object({
      collection: z.string().min(1).describe('Collection name'),
      id: z.number().describe('Item ID'),
    });

    it('should create a tool with correct structure', () => {
      const tool = createTool({
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: TestSchema,
        toolsets: ['default', 'content'],
        handler: async (_client, args) => ({ success: true, data: args }),
      });

      expect(tool.name).toBe('test_tool');
      expect(tool.description).toBe('A test tool');
      expect(tool.inputSchema).toBe(TestSchema);
      expect(tool.toolsets).toEqual(['default', 'content']);
      expect(typeof tool.handler).toBe('function');
    });

    it('should handle successful tool execution with data return', async () => {
      const mockResult = { id: 1, name: 'Test Item' };
      const tool = createTool({
        name: 'get_test',
        description: 'Get test data',
        inputSchema: TestSchema,
        toolsets: ['default'],
        handler: async (_client, _args) => mockResult,
      });

      const result = await tool.handler(mockClient, { collection: 'test', id: 1 });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2),
          },
        ],
      });
    });

    it('should format JSON response correctly', async () => {
      const complexData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        meta: { total: 2 },
      };

      const tool = createTool({
        name: 'complex_tool',
        description: 'Complex data tool',
        inputSchema: TestSchema,
        toolsets: ['default'],
        handler: async (_client, _args) => complexData,
      });

      const result = await tool.handler(mockClient, { collection: 'test', id: 1 });

      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(complexData);
    });

    it('should pass arguments correctly to handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const tool = createTool({
        name: 'arg_test',
        description: 'Argument test',
        inputSchema: TestSchema,
        toolsets: ['default'],
        handler: mockHandler,
      });

      const args = { collection: 'articles', id: 42 };
      await tool.handler(mockClient, args);

      expect(mockHandler).toHaveBeenCalledWith(mockClient, args);
    });

    it('should handle empty results', async () => {
      const tool = createTool({
        name: 'empty_tool',
        description: 'Empty result tool',
        inputSchema: TestSchema,
        toolsets: ['default'],
        handler: async (_client, _args) => [],
      });

      const result = await tool.handler(mockClient, { collection: 'test', id: 1 });
      expect(JSON.parse(result.content[0].text)).toEqual([]);
    });
  });

  describe('createActionTool', () => {
    const DeleteSchema = z.object({
      collection: z.string().min(1).describe('Collection name'),
      id: z.number().describe('Item ID to delete'),
    });

    it('should create an action tool with correct structure', () => {
      const tool = createActionTool({
        name: 'delete_tool',
        description: 'Delete an item',
        inputSchema: DeleteSchema,
        toolsets: ['default'],
        handler: async (_client, _args) => undefined,
        successMessage: (args) => `Deleted item ${args.id}`,
      });

      expect(tool.name).toBe('delete_tool');
      expect(tool.description).toBe('Delete an item');
      expect(tool.inputSchema).toBe(DeleteSchema);
      expect(tool.toolsets).toEqual(['default']);
      expect(typeof tool.handler).toBe('function');
    });

    it('should return success message on successful execution', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);
      const tool = createActionTool({
        name: 'delete_success',
        description: 'Delete with success',
        inputSchema: DeleteSchema,
        toolsets: ['default'],
        handler: mockHandler,
        successMessage: (args) => `Successfully deleted item ${args.id} from ${args.collection}`,
      });

      const args = { collection: 'articles', id: 123 };
      const result = await tool.handler(mockClient, args);

      expect(mockHandler).toHaveBeenCalledWith(mockClient, args);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Successfully deleted item 123 from articles',
          },
        ],
      });
    });

    it('should call successMessage function with correct arguments', async () => {
      const successMessageFn = vi.fn().mockReturnValue('Custom success message');
      const tool = createActionTool({
        name: 'custom_message',
        description: 'Custom message tool',
        inputSchema: DeleteSchema,
        toolsets: ['default'],
        handler: async (_client, _args) => undefined,
        successMessage: successMessageFn,
      });

      const args = { collection: 'users', id: 456 };
      await tool.handler(mockClient, args);

      expect(successMessageFn).toHaveBeenCalledWith(args);
    });

    it('should handle void return from handler', async () => {
      const tool = createActionTool({
        name: 'void_handler',
        description: 'Void handler tool',
        inputSchema: DeleteSchema,
        toolsets: ['default'],
        handler: async (_client, _args) => {
          // Handler returns void
        },
        successMessage: (_args) => 'Operation completed',
      });

      const result = await tool.handler(mockClient, { collection: 'test', id: 1 });
      expect(result.content[0].text).toBe('Operation completed');
    });

    it('should handle async handler that throws', async () => {
      const tool = createActionTool({
        name: 'error_tool',
        description: 'Error tool',
        inputSchema: DeleteSchema,
        toolsets: ['default'],
        handler: async (_client, _args) => {
          throw new Error('Handler failed');
        },
        successMessage: (_args) => 'Should not reach here',
      });

      await expect(tool.handler(mockClient, { collection: 'test', id: 1 }))
        .rejects.toThrow('Handler failed');
    });
  });

  describe('integration with real schemas', () => {
    it('should work with imported schemas', async () => {
      // Test that the helpers work with real schema imports
      const RealSchema = z.object({
        name: z.string().min(1),
        count: z.number().positive(),
      });

      const tool = createTool({
        name: 'real_schema_tool',
        description: 'Tool with real schema',
        inputSchema: RealSchema,
        toolsets: ['default'],
        handler: async (_client, args) => ({ result: args.name, total: args.count }),
      });

      const result = await tool.handler(mockClient, { name: 'test', count: 5 });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual({ result: 'test', total: 5 });
    });
  });
});
