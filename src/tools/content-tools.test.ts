import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contentTools } from './content-tools.js';
import { DirectusClient } from '../directus-client.js';

describe('Content Tools', () => {
  let mockClient: {
    [K in keyof DirectusClient]: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      queryItems: vi.fn(),
      getItem: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      bulkCreateItems: vi.fn(),
      bulkUpdateItems: vi.fn(),
      bulkDeleteItems: vi.fn(),
    } as any;
  });

  describe('query_items', () => {
    it('should query items with basic parameters', async () => {
      const mockData = {
        data: [
          { id: 1, title: 'Article 1', status: 'published' },
          { id: 2, title: 'Article 2', status: 'draft' },
        ],
      };
      mockClient.queryItems.mockResolvedValue(mockData);

      const tool = contentTools.find((t) => t.name === 'query_items');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.queryItems).toHaveBeenCalledWith('articles', {});
    });

    it('should query items with filter', async () => {
      const mockData = {
        data: [{ id: 1, title: 'Article 1', status: 'published' }],
      };
      mockClient.queryItems.mockResolvedValue(mockData);

      const tool = contentTools.find((t) => t.name === 'query_items');
      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        filter: { status: { _eq: 'published' } },
      });

      expect(mockClient.queryItems).toHaveBeenCalledWith('articles', {
        filter: { status: { _eq: 'published' } },
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
    });

    it('should query items with multiple parameters', async () => {
      const mockData = { data: [] };
      mockClient.queryItems.mockResolvedValue(mockData);

      const tool = contentTools.find((t) => t.name === 'query_items');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        fields: ['id', 'title', 'status'],
        filter: { status: { _eq: 'published' } },
        search: 'test query',
        sort: ['-date_created', 'title'],
        limit: 10,
        offset: 0,
      });

      expect(mockClient.queryItems).toHaveBeenCalledWith('articles', {
        fields: ['id', 'title', 'status'],
        filter: { status: { _eq: 'published' } },
        search: 'test query',
        sort: ['-date_created', 'title'],
        limit: 10,
        offset: 0,
      });
    });

    it('should query items with pagination', async () => {
      mockClient.queryItems.mockResolvedValue({ data: [] });

      const tool = contentTools.find((t) => t.name === 'query_items');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        page: 2,
        limit: 20,
      });

      expect(mockClient.queryItems).toHaveBeenCalledWith('articles', {
        page: 2,
        limit: 20,
      });
    });

    it('should query items with aggregate', async () => {
      const mockData = { data: [{ count: 10 }] };
      mockClient.queryItems.mockResolvedValue(mockData);

      const tool = contentTools.find((t) => t.name === 'query_items');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        aggregate: { count: '*' },
      });

      expect(mockClient.queryItems).toHaveBeenCalledWith('articles', {
        aggregate: { count: '*' },
      });
    });

    it('should query items with groupBy', async () => {
      mockClient.queryItems.mockResolvedValue({ data: [] });

      const tool = contentTools.find((t) => t.name === 'query_items');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        groupBy: ['status', 'category'],
      });

      expect(mockClient.queryItems).toHaveBeenCalledWith('articles', {
        groupBy: ['status', 'category'],
      });
    });

    it('should query items with deep query', async () => {
      mockClient.queryItems.mockResolvedValue({ data: [] });

      const tool = contentTools.find((t) => t.name === 'query_items');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        deep: { author: { _limit: 1 } },
      });

      expect(mockClient.queryItems).toHaveBeenCalledWith('articles', {
        deep: { author: { _limit: 1 } },
      });
    });

    it('should validate collection is required', () => {
      const tool = contentTools.find((t) => t.name === 'query_items');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('get_item', () => {
    it('should get a single item by ID', async () => {
      const mockData = { id: 1, title: 'Article 1', status: 'published' };
      mockClient.getItem.mockResolvedValue(mockData);

      const tool = contentTools.find((t) => t.name === 'get_item');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        id: 1,
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getItem).toHaveBeenCalledWith('articles', 1, {});
    });

    it('should get item with string ID', async () => {
      const mockData = { id: 'uuid-123', title: 'Article' };
      mockClient.getItem.mockResolvedValue(mockData);

      const tool = contentTools.find((t) => t.name === 'get_item');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        id: 'uuid-123',
      });

      expect(mockClient.getItem).toHaveBeenCalledWith('articles', 'uuid-123', {});
    });

    it('should get item with fields and deep query', async () => {
      mockClient.getItem.mockResolvedValue({ id: 1 });

      const tool = contentTools.find((t) => t.name === 'get_item');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        id: 1,
        fields: ['id', 'title'],
        deep: { author: {} },
      });

      expect(mockClient.getItem).toHaveBeenCalledWith('articles', 1, {
        fields: ['id', 'title'],
        deep: { author: {} },
      });
    });
  });

  describe('create_item', () => {
    it('should create a new item', async () => {
      const itemData = {
        collection: 'articles',
        data: { title: 'New Article', status: 'draft', body: 'Content...' },
      };
      const mockResponse = { id: 1, ...itemData.data };
      mockClient.createItem.mockResolvedValue(mockResponse);

      const tool = contentTools.find((t) => t.name === 'create_item');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, itemData);
      expect(mockClient.createItem).toHaveBeenCalledWith(
        'articles',
        itemData.data
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate required fields', () => {
      const tool = contentTools.find((t) => t.name === 'create_item');
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).toThrow();
    });
  });

  describe('update_item', () => {
    it('should update an existing item', async () => {
      const updateData = {
        collection: 'articles',
        id: 1,
        data: { status: 'published' },
      };
      const mockResponse = { id: 1, status: 'published' };
      mockClient.updateItem.mockResolvedValue(mockResponse);

      const tool = contentTools.find((t) => t.name === 'update_item');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, updateData);
      expect(mockClient.updateItem).toHaveBeenCalledWith(
        'articles',
        1,
        updateData.data
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should update item with string ID', async () => {
      mockClient.updateItem.mockResolvedValue({ id: 'uuid-123' });

      const tool = contentTools.find((t) => t.name === 'update_item');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        id: 'uuid-123',
        data: { title: 'Updated' },
      });

      expect(mockClient.updateItem).toHaveBeenCalledWith(
        'articles',
        'uuid-123',
        { title: 'Updated' }
      );
    });
  });

  describe('delete_item', () => {
    it('should delete an item', async () => {
      mockClient.deleteItem.mockResolvedValue({ success: true });

      const tool = contentTools.find((t) => t.name === 'delete_item');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        id: 1,
      });
      expect(mockClient.deleteItem).toHaveBeenCalledWith('articles', 1);
      expect(result.content[0].text).toContain('deleted');
    });

    it('should delete item with string ID', async () => {
      mockClient.deleteItem.mockResolvedValue({ success: true });

      const tool = contentTools.find((t) => t.name === 'delete_item');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        id: 'uuid-123',
      });

      expect(mockClient.deleteItem).toHaveBeenCalledWith('articles', 'uuid-123');
    });
  });

  describe('bulk_create_items', () => {
    it('should create multiple items', async () => {
      const items = [
        { title: 'Article 1', status: 'draft' },
        { title: 'Article 2', status: 'draft' },
      ];
      const mockResponse = { data: items.map((item, i) => ({ id: i + 1, ...item })) };
      mockClient.bulkCreateItems.mockResolvedValue(mockResponse);

      const tool = contentTools.find((t) => t.name === 'bulk_create_items');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        items,
      });
      expect(mockClient.bulkCreateItems).toHaveBeenCalledWith('articles', items);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate items array is required', () => {
      const tool = contentTools.find((t) => t.name === 'bulk_create_items');
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).toThrow();
    });
  });

  describe('bulk_update_items', () => {
    it('should update multiple items', async () => {
      const items = [
        { id: 1, status: 'published' },
        { id: 2, status: 'published' },
      ];
      const mockResponse = { data: items };
      mockClient.bulkUpdateItems.mockResolvedValue(mockResponse);

      const tool = contentTools.find((t) => t.name === 'bulk_update_items');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        items,
      });
      expect(mockClient.bulkUpdateItems).toHaveBeenCalledWith('articles', items);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });
  });

  describe('bulk_delete_items', () => {
    it('should delete multiple items', async () => {
      const ids = [1, 2, 3];
      mockClient.bulkDeleteItems.mockResolvedValue({ success: true });

      const tool = contentTools.find((t) => t.name === 'bulk_delete_items');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        ids,
      });
      expect(mockClient.bulkDeleteItems).toHaveBeenCalledWith('articles', ids);
      expect(result.content[0].text).toContain('3 items deleted');
    });

    it('should handle string IDs', async () => {
      const ids = ['uuid-1', 'uuid-2'];
      mockClient.bulkDeleteItems.mockResolvedValue({ success: true });

      const tool = contentTools.find((t) => t.name === 'bulk_delete_items');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        ids,
      });

      expect(mockClient.bulkDeleteItems).toHaveBeenCalledWith('articles', ids);
    });

    it('should validate ids array is required', () => {
      const tool = contentTools.find((t) => t.name === 'bulk_delete_items');
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).toThrow();
    });
  });

  describe('Input Schema Validation', () => {
    it('should validate query_items schema with all optional fields', () => {
      const tool = contentTools.find((t) => t.name === 'query_items');
      const validData = {
        collection: 'articles',
        fields: ['id', 'title'],
        filter: { status: { _eq: 'published' } },
        search: 'test',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        page: 1,
        aggregate: { count: '*' },
        groupBy: ['status'],
        deep: { author: {} },
      };
      expect(() => {
        tool!.inputSchema.parse(validData);
      }).not.toThrow();
    });

    it('should validate get_item accepts string or number ID', () => {
      const tool = contentTools.find((t) => t.name === 'get_item');
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles', id: 1 });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles', id: 'uuid-123' });
      }).not.toThrow();
    });

    it('should validate create_item requires data', () => {
      const tool = contentTools.find((t) => t.name === 'create_item');
      expect(() => {
        tool!.inputSchema.parse({
          collection: 'articles',
          data: { title: 'Test' },
        });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).toThrow();
    });
  });
});

