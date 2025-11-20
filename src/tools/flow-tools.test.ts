import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flowTools } from './flow-tools.js';
import { DirectusClient } from '../directus-client.js';

describe('Flow Tools', () => {
  let mockClient: {
    [K in keyof DirectusClient]: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      listFlows: vi.fn(),
      getFlow: vi.fn(),
      createFlow: vi.fn(),
      createFlows: vi.fn(),
      updateFlow: vi.fn(),
      updateFlows: vi.fn(),
      deleteFlow: vi.fn(),
      deleteFlows: vi.fn(),
      triggerFlow: vi.fn(),
    } as any;
  });

  describe('list_flows', () => {
    it('should list all flows', async () => {
      const mockData = {
        data: [
          { id: 'flow-1', name: 'Flow 1', status: 'active' },
          { id: 'flow-2', name: 'Flow 2', status: 'inactive' },
        ],
      };
      mockClient.listFlows.mockResolvedValue(mockData);

      const tool = flowTools.find((t) => t.name === 'list_flows');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {});
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.listFlows).toHaveBeenCalledWith({});
    });

    it('should list flows with filter', async () => {
      const mockData = {
        data: [{ id: 'flow-1', name: 'Flow 1', status: 'active' }],
      };
      mockClient.listFlows.mockResolvedValue(mockData);

      const tool = flowTools.find((t) => t.name === 'list_flows');
      await tool!.handler(mockClient as any, {
        filter: { status: { _eq: 'active' } },
      });

      expect(mockClient.listFlows).toHaveBeenCalledWith({
        filter: { status: { _eq: 'active' } },
      });
    });

    it('should list flows with multiple parameters', async () => {
      mockClient.listFlows.mockResolvedValue({ data: [] });

      const tool = flowTools.find((t) => t.name === 'list_flows');
      await tool!.handler(mockClient as any, {
        fields: ['id', 'name', 'status'],
        filter: { status: { _eq: 'active' } },
        search: 'test',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        meta: 'total_count',
      });

      expect(mockClient.listFlows).toHaveBeenCalledWith({
        fields: ['id', 'name', 'status'],
        filter: { status: { _eq: 'active' } },
        search: 'test',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        meta: 'total_count',
      });
    });
  });

  describe('get_flow', () => {
    it('should get a single flow by ID', async () => {
      const mockData = {
        id: 'flow-1',
        name: 'Test Flow',
        status: 'active',
        trigger: 'manual',
      };
      mockClient.getFlow.mockResolvedValue(mockData);

      const tool = flowTools.find((t) => t.name === 'get_flow');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        id: 'flow-1',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getFlow).toHaveBeenCalledWith('flow-1', {});
    });

    it('should get flow with fields and meta', async () => {
      mockClient.getFlow.mockResolvedValue({ id: 'flow-1' });

      const tool = flowTools.find((t) => t.name === 'get_flow');
      await tool!.handler(mockClient as any, {
        id: 'flow-1',
        fields: ['id', 'name'],
        meta: 'total_count',
      });

      expect(mockClient.getFlow).toHaveBeenCalledWith('flow-1', {
        fields: ['id', 'name'],
        meta: 'total_count',
      });
    });

    it('should validate id is required', () => {
      const tool = flowTools.find((t) => t.name === 'get_flow');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('create_flow', () => {
    it('should create a new flow', async () => {
      const flowData = {
        name: 'New Flow',
        trigger: 'manual',
        status: 'active',
      };
      const mockResponse = { id: 'flow-1', ...flowData };
      mockClient.createFlow.mockResolvedValue(mockResponse);

      const tool = flowTools.find((t) => t.name === 'create_flow');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, flowData);
      expect(mockClient.createFlow).toHaveBeenCalledWith(flowData);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should create flow with all optional fields', async () => {
      const flowData = {
        name: 'Complete Flow',
        icon: 'flow-icon',
        color: 'blue',
        description: 'A test flow',
        status: 'active' as const,
        trigger: 'webhook' as const,
        accountability: '$trigger',
        options: { method: 'POST' },
        operation: 'operation-uuid',
      };
      mockClient.createFlow.mockResolvedValue({ id: 'flow-1', ...flowData });

      const tool = flowTools.find((t) => t.name === 'create_flow');
      await tool!.handler(mockClient as any, flowData);

      expect(mockClient.createFlow).toHaveBeenCalledWith(flowData);
    });

    it('should validate name and trigger are required', () => {
      const tool = flowTools.find((t) => t.name === 'create_flow');
      expect(() => {
        tool!.inputSchema.parse({ name: 'Flow', trigger: 'manual' });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({ name: 'Flow' });
      }).toThrow();
      expect(() => {
        tool!.inputSchema.parse({ trigger: 'manual' });
      }).toThrow();
    });

    it('should validate trigger enum', () => {
      const tool = flowTools.find((t) => t.name === 'create_flow');
      expect(() => {
        tool!.inputSchema.parse({
          name: 'Flow',
          trigger: 'invalid',
        });
      }).toThrow();
    });

    it('should validate status enum', () => {
      const tool = flowTools.find((t) => t.name === 'create_flow');
      expect(() => {
        tool!.inputSchema.parse({
          name: 'Flow',
          trigger: 'manual',
          status: 'invalid',
        });
      }).toThrow();
    });
  });

  describe('create_flows', () => {
    it('should create multiple flows', async () => {
      const flows = [
        { name: 'Flow 1', trigger: 'manual' as const },
        { name: 'Flow 2', trigger: 'webhook' as const },
      ];
      const mockResponse = {
        data: flows.map((flow, i) => ({ id: `flow-${i + 1}`, ...flow })),
      };
      mockClient.createFlows.mockResolvedValue(mockResponse);

      const tool = flowTools.find((t) => t.name === 'create_flows');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, { flows });
      expect(mockClient.createFlows).toHaveBeenCalledWith(flows);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate flows array is required', () => {
      const tool = flowTools.find((t) => t.name === 'create_flows');
      expect(() => {
        tool!.inputSchema.parse({ flows: [] });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_flow', () => {
    it('should update an existing flow', async () => {
      const updateData = {
        id: 'flow-1',
        status: 'inactive' as const,
        name: 'Updated Flow Name',
      };
      const mockResponse = { ...updateData };
      mockClient.updateFlow.mockResolvedValue(mockResponse);

      const tool = flowTools.find((t) => t.name === 'update_flow');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, updateData);
      expect(mockClient.updateFlow).toHaveBeenCalledWith('flow-1', {
        status: 'inactive',
        name: 'Updated Flow Name',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should update flow with all optional fields', async () => {
      const updateData = {
        id: 'flow-1',
        name: 'Updated',
        icon: 'new-icon',
        color: 'red',
        description: 'Updated description',
        status: 'active' as const,
        trigger: 'manual' as const,
        accountability: '$full',
        options: { newOption: true },
        operation: 'new-operation-uuid',
      };
      mockClient.updateFlow.mockResolvedValue({ ...updateData });

      const tool = flowTools.find((t) => t.name === 'update_flow');
      await tool!.handler(mockClient as any, updateData);

      expect(mockClient.updateFlow).toHaveBeenCalledWith('flow-1', {
        name: 'Updated',
        icon: 'new-icon',
        color: 'red',
        description: 'Updated description',
        status: 'active',
        trigger: 'manual',
        accountability: '$full',
        options: { newOption: true },
        operation: 'new-operation-uuid',
      });
    });

    it('should validate id is required', () => {
      const tool = flowTools.find((t) => t.name === 'update_flow');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_flows', () => {
    it('should update multiple flows', async () => {
      const flows = [
        { id: 'flow-1', status: 'active' as const },
        { id: 'flow-2', status: 'inactive' as const },
      ];
      const mockResponse = { data: flows };
      mockClient.updateFlows.mockResolvedValue(mockResponse);

      const tool = flowTools.find((t) => t.name === 'update_flows');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, { flows });
      expect(mockClient.updateFlows).toHaveBeenCalledWith(flows);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate flows array is required', () => {
      const tool = flowTools.find((t) => t.name === 'update_flows');
      expect(() => {
        tool!.inputSchema.parse({ flows: [] });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('delete_flow', () => {
    it('should delete a flow', async () => {
      mockClient.deleteFlow.mockResolvedValue({ success: true });

      const tool = flowTools.find((t) => t.name === 'delete_flow');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        id: 'flow-1',
      });
      expect(mockClient.deleteFlow).toHaveBeenCalledWith('flow-1');
      expect(result.content[0].text).toContain('deleted successfully');
    });

    it('should validate id is required', () => {
      const tool = flowTools.find((t) => t.name === 'delete_flow');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('delete_flows', () => {
    it('should delete multiple flows', async () => {
      const ids = ['flow-1', 'flow-2', 'flow-3'];
      mockClient.deleteFlows.mockResolvedValue({ success: true });

      const tool = flowTools.find((t) => t.name === 'delete_flows');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, { ids });
      expect(mockClient.deleteFlows).toHaveBeenCalledWith(ids);
      expect(result.content[0].text).toContain('3 flows deleted');
    });

    it('should validate ids array is required', () => {
      const tool = flowTools.find((t) => t.name === 'delete_flows');
      expect(() => {
        tool!.inputSchema.parse({ ids: [] });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('trigger_flow', () => {
    it('should trigger a flow with GET method', async () => {
      const mockData = { success: true, data: { result: 'triggered' } };
      mockClient.triggerFlow.mockResolvedValue(mockData);

      const tool = flowTools.find((t) => t.name === 'trigger_flow');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        id: 'flow-1',
        method: 'GET',
      });
      expect(mockClient.triggerFlow).toHaveBeenCalledWith(
        'GET',
        'flow-1',
        undefined,
        undefined
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
    });

    it('should trigger a flow with POST method and data', async () => {
      const bodyData = { key: 'value', test: 'data' };
      const mockData = { success: true, data: bodyData };
      mockClient.triggerFlow.mockResolvedValue(mockData);

      const tool = flowTools.find((t) => t.name === 'trigger_flow');
      await tool!.handler(mockClient as any, {
        id: 'flow-1',
        method: 'POST',
        data: bodyData,
      });

      expect(mockClient.triggerFlow).toHaveBeenCalledWith(
        'POST',
        'flow-1',
        bodyData,
        undefined
      );
    });

    it('should trigger flow with query parameters', async () => {
      mockClient.triggerFlow.mockResolvedValue({ success: true });

      const tool = flowTools.find((t) => t.name === 'trigger_flow');
      await tool!.handler(mockClient as any, {
        id: 'flow-1',
        method: 'GET',
        fields: ['id', 'name'],
        meta: 'total_count',
      });

      expect(mockClient.triggerFlow).toHaveBeenCalledWith(
        'GET',
        'flow-1',
        undefined,
        { fields: ['id', 'name'], meta: 'total_count' }
      );
    });

    it('should trigger flow with POST, data, and query parameters', async () => {
      const bodyData = { key: 'value' };
      mockClient.triggerFlow.mockResolvedValue({ success: true });

      const tool = flowTools.find((t) => t.name === 'trigger_flow');
      await tool!.handler(mockClient as any, {
        id: 'flow-1',
        method: 'POST',
        data: bodyData,
        fields: ['id'],
        meta: 'total_count',
      });

      expect(mockClient.triggerFlow).toHaveBeenCalledWith(
        'POST',
        'flow-1',
        bodyData,
        { fields: ['id'], meta: 'total_count' }
      );
    });

    it('should default to GET method when not specified', async () => {
      mockClient.triggerFlow.mockResolvedValue({ success: true });

      const tool = flowTools.find((t) => t.name === 'trigger_flow');
      await tool!.handler(mockClient as any, {
        id: 'flow-1',
      });

      expect(mockClient.triggerFlow).toHaveBeenCalledWith(
        'GET',
        'flow-1',
        undefined,
        undefined
      );
    });

    it('should validate method enum', () => {
      const tool = flowTools.find((t) => t.name === 'trigger_flow');
      expect(() => {
        tool!.inputSchema.parse({
          id: 'flow-1',
          method: 'PUT',
        });
      }).toThrow();
    });

    it('should validate id is required', () => {
      const tool = flowTools.find((t) => t.name === 'trigger_flow');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('Input Schema Validation', () => {
    it('should validate list_flows accepts all optional parameters', () => {
      const tool = flowTools.find((t) => t.name === 'list_flows');
      const validData = {
        fields: ['id', 'name'],
        filter: { status: { _eq: 'active' } },
        search: 'test',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        meta: 'total_count',
      };
      expect(() => {
        tool!.inputSchema.parse(validData);
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).not.toThrow();
    });
  });
});

