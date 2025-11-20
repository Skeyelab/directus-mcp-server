import { describe, it, expect, beforeEach, vi } from 'vitest';
import { operationTools } from './operation-tools.js';
import { DirectusClient } from '../directus-client.js';

describe('Operation Tools', () => {
  let mockClient: {
    [K in keyof DirectusClient]: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      listOperations: vi.fn(),
      getOperation: vi.fn(),
      createOperation: vi.fn(),
      createOperations: vi.fn(),
      updateOperation: vi.fn(),
      updateOperations: vi.fn(),
      deleteOperation: vi.fn(),
      deleteOperations: vi.fn(),
    } as any;
  });

  describe('list_operations', () => {
    it('should list all operations', async () => {
      const mockData = {
        data: [
          { id: 'op-1', name: 'Log to Console', key: 'log_console', type: 'log' },
          { id: 'op-2', name: 'Send Email', key: 'send_email', type: 'mail' },
        ],
      };
      mockClient.listOperations.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'list_operations');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {});
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.listOperations).toHaveBeenCalledWith({});
    });

    it('should list operations with filter', async () => {
      const mockData = {
        data: [{ id: 'op-1', name: 'Log to Console', key: 'log_console', type: 'log' }],
      };
      mockClient.listOperations.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'list_operations');
      await tool!.handler(mockClient as any, {
        filter: { type: { _eq: 'log' } },
      });

      expect(mockClient.listOperations).toHaveBeenCalledWith({
        filter: { type: { _eq: 'log' } },
      });
    });

    it('should list operations with multiple parameters', async () => {
      mockClient.listOperations.mockResolvedValue({ data: [] });

      const tool = operationTools.find((t) => t.name === 'list_operations');
      await tool!.handler(mockClient as any, {
        fields: ['id', 'name', 'type'],
        filter: { flow: { _eq: 'flow-1' } },
        search: 'log',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        meta: 'total_count',
      });

      expect(mockClient.listOperations).toHaveBeenCalledWith({
        fields: ['id', 'name', 'type'],
        filter: { flow: { _eq: 'flow-1' } },
        search: 'log',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        meta: 'total_count',
      });
    });
  });

  describe('get_operation', () => {
    it('should get a single operation by ID', async () => {
      const mockData = {
        id: 'op-1',
        name: 'Log to Console',
        key: 'log_console',
        type: 'log',
        position_x: 12,
        position_y: 12,
      };
      mockClient.getOperation.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'get_operation');
      const result = await tool!.handler(mockClient as any, { id: 'op-1' });

      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getOperation).toHaveBeenCalledWith('op-1', {});
    });

    it('should get operation with fields and meta', async () => {
      const mockData = {
        id: 'op-1',
        name: 'Log to Console',
      };
      mockClient.getOperation.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'get_operation');
      await tool!.handler(mockClient as any, {
        id: 'op-1',
        fields: ['id', 'name'],
        meta: 'total_count',
      });

      expect(mockClient.getOperation).toHaveBeenCalledWith('op-1', {
        fields: ['id', 'name'],
        meta: 'total_count',
      });
    });

    it('should validate id is required', () => {
      const tool = operationTools.find((t) => t.name === 'get_operation');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('create_operation', () => {
    it('should create a new operation', async () => {
      const mockData = {
        id: 'op-1',
        name: 'Log to Console',
        key: 'log_console',
        type: 'log',
        date_created: '2024-01-01T00:00:00Z',
      };
      mockClient.createOperation.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'create_operation');
      const result = await tool!.handler(mockClient as any, {
        name: 'Log to Console',
        key: 'log_console',
        type: 'log',
      });

      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.createOperation).toHaveBeenCalledWith({
        name: 'Log to Console',
        key: 'log_console',
        type: 'log',
      });
    });

    it('should create operation with all optional fields', async () => {
      const mockData = { id: 'op-1', name: 'Send Email', type: 'mail' };
      mockClient.createOperation.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'create_operation');
      await tool!.handler(mockClient as any, {
        name: 'Send Email',
        key: 'send_email',
        type: 'mail',
        position_x: 24,
        position_y: 36,
        options: { to: 'user@example.com', subject: 'Test' },
        resolve: 'op-2',
        reject: 'op-3',
        flow: 'flow-1',
      });

      expect(mockClient.createOperation).toHaveBeenCalledWith({
        name: 'Send Email',
        key: 'send_email',
        type: 'mail',
        position_x: 24,
        position_y: 36,
        options: { to: 'user@example.com', subject: 'Test' },
        resolve: 'op-2',
        reject: 'op-3',
        flow: 'flow-1',
      });
    });

    it('should validate name and key and type are required', () => {
      const tool = operationTools.find((t) => t.name === 'create_operation');
      expect(() => {
        tool!.inputSchema.parse({ name: 'Test', key: 'test', type: 'log' });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({ name: 'Test', key: 'test' });
      }).toThrow();
      expect(() => {
        tool!.inputSchema.parse({ name: 'Test', type: 'log' });
      }).toThrow();
      expect(() => {
        tool!.inputSchema.parse({ key: 'test', type: 'log' });
      }).toThrow();
    });

    it('should validate operation type enum', () => {
      const tool = operationTools.find((t) => t.name === 'create_operation');
      expect(() => {
        tool!.inputSchema.parse({
          name: 'Test Operation',
          key: 'test_op',
          type: 'condition', // Valid enum value
        });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({
          name: 'Test Operation',
          key: 'test_op',
          type: 'invalid_type',
        });
      }).toThrow();
    });
  });

  describe('create_operations', () => {
    it('should create multiple operations', async () => {
      const mockData = [
        { id: 'op-1', name: 'Op 1', type: 'log' },
        { id: 'op-2', name: 'Op 2', type: 'transform' },
      ];
      mockClient.createOperations.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'create_operations');
      const result = await tool!.handler(mockClient as any, {
        operations: [
          { name: 'Op 1', key: 'op1', type: 'log' },
          { name: 'Op 2', key: 'op2', type: 'transform' },
        ],
      });

      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.createOperations).toHaveBeenCalledWith([
        { name: 'Op 1', key: 'op1', type: 'log' },
        { name: 'Op 2', key: 'op2', type: 'transform' },
      ]);
    });

    it('should validate operations array is required', () => {
      const tool = operationTools.find((t) => t.name === 'create_operations');
      expect(() => {
        tool!.inputSchema.parse({ operations: [] });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_operation', () => {
    it('should update an existing operation', async () => {
      const mockData = {
        id: 'op-1',
        name: 'Updated Operation',
        type: 'mail',
      };
      mockClient.updateOperation.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'update_operation');
      const result = await tool!.handler(mockClient as any, {
        id: 'op-1',
        name: 'Updated Operation',
        type: 'mail',
      });

      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.updateOperation).toHaveBeenCalledWith('op-1', {
        name: 'Updated Operation',
        type: 'mail',
      });
    });

    it('should update operation with all optional fields', async () => {
      const mockData = { id: 'op-1', name: 'Updated Op' };
      mockClient.updateOperation.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'update_operation');
      await tool!.handler(mockClient as any, {
        id: 'op-1',
        name: 'Updated Op',
        key: 'updated_key',
        type: 'notification',
        position_x: 48,
        position_y: 60,
        options: { message: 'Updated' },
        resolve: 'op-4',
        reject: 'op-5',
        flow: 'flow-2',
      });

      expect(mockClient.updateOperation).toHaveBeenCalledWith('op-1', {
        name: 'Updated Op',
        key: 'updated_key',
        type: 'notification',
        position_x: 48,
        position_y: 60,
        options: { message: 'Updated' },
        resolve: 'op-4',
        reject: 'op-5',
        flow: 'flow-2',
      });
    });

    it('should validate id is required', () => {
      const tool = operationTools.find((t) => t.name === 'update_operation');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_operations', () => {
    it('should update multiple operations', async () => {
      const mockData = [
        { id: 'op-1', name: 'Updated Op 1' },
        { id: 'op-2', name: 'Updated Op 2' },
      ];
      mockClient.updateOperations.mockResolvedValue(mockData);

      const tool = operationTools.find((t) => t.name === 'update_operations');
      const result = await tool!.handler(mockClient as any, {
        operations: [
          { id: 'op-1', name: 'Updated Op 1' },
          { id: 'op-2', name: 'Updated Op 2' },
        ],
      });

      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.updateOperations).toHaveBeenCalledWith([
        { id: 'op-1', name: 'Updated Op 1' },
        { id: 'op-2', name: 'Updated Op 2' },
      ]);
    });

    it('should validate operations array is required', () => {
      const tool = operationTools.find((t) => t.name === 'update_operations');
      expect(() => {
        tool!.inputSchema.parse({ operations: [] });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('delete_operation', () => {
    it('should delete an operation', async () => {
      mockClient.deleteOperation.mockResolvedValue({ success: true });

      const tool = operationTools.find((t) => t.name === 'delete_operation');
      const result = await tool!.handler(mockClient as any, { id: 'op-1' });

      expect(result.content[0].text).toContain('deleted successfully');
      expect(mockClient.deleteOperation).toHaveBeenCalledWith('op-1');
    });

    it('should validate id is required', () => {
      const tool = operationTools.find((t) => t.name === 'delete_operation');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('delete_operations', () => {
    it('should delete multiple operations', async () => {
      mockClient.deleteOperations.mockResolvedValue({ success: true });

      const tool = operationTools.find((t) => t.name === 'delete_operations');
      const result = await tool!.handler(mockClient as any, { ids: ['op-1', 'op-2'] });

      expect(result.content[0].text).toContain('deleted successfully');
      expect(mockClient.deleteOperations).toHaveBeenCalledWith(['op-1', 'op-2']);
    });

    it('should validate ids array is required', () => {
      const tool = operationTools.find((t) => t.name === 'delete_operations');
      expect(() => {
        tool!.inputSchema.parse({ ids: [] });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('Input Schema Validation', () => {
    it('should validate list_operations accepts all optional parameters', async () => {
      mockClient.listOperations.mockResolvedValue({ data: [] });

      const tool = operationTools.find((t) => t.name === 'list_operations');
      await expect(
        tool!.handler(mockClient as any, {
          fields: ['id', 'name'],
          filter: { type: { _eq: 'log' } },
          search: 'test',
          sort: ['name'],
          limit: 5,
          offset: 10,
          meta: 'filter_count',
        })
      ).resolves.toBeDefined();
    });

    it('should validate create_operation accepts valid operation types', async () => {
      mockClient.createOperation.mockResolvedValue({ id: 'op-1' });

      const tool = operationTools.find((t) => t.name === 'create_operation');
      await expect(
        tool!.handler(mockClient as any, {
          name: 'Valid Operation',
          key: 'valid_op',
          type: 'condition', // Valid enum value
        })
      ).resolves.toBeDefined();
    });
  });
});
