import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DirectusClient, createDirectusClient } from './directus-client.js';
import type { DirectusConfig } from './types/index.js';

// Mock @directus/sdk
const mockLogin = vi.fn();
const mockClientWithAuth = {
  login: mockLogin,
};

vi.mock('@directus/sdk', () => {
  const mockAuthPlugin = {};
  return {
    createDirectus: vi.fn(() => ({
      with: vi.fn((plugin: unknown) => {
        if (plugin === 'rest') {
          return {
            with: vi.fn((authPlugin: unknown) => {
              // When authentication plugin is passed, return client with login method
              if (authPlugin === mockAuthPlugin) {
                return mockClientWithAuth;
              }
              // For staticToken, return empty object
              return {};
            }),
          };
        }
        return {};
      }),
    })),
    rest: vi.fn(() => 'rest'),
    authentication: vi.fn(() => mockAuthPlugin),
    staticToken: vi.fn(() => ({})),
  };
});

describe('DirectusClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const baseUrl = 'https://directus.example.com';

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  describe('Initialization', () => {
    it('should initialize with token authentication', () => {
      const config: DirectusConfig = {
        url: baseUrl,
        token: 'test-token',
      };
      const client = new DirectusClient(config);
      expect(client).toBeInstanceOf(DirectusClient);
    });

    it('should initialize with email/password authentication', () => {
      const config: DirectusConfig = {
        url: baseUrl,
        email: 'test@example.com',
        password: 'test-password',
      };
      const client = new DirectusClient(config);
      expect(client).toBeInstanceOf(DirectusClient);
    });

    it('should throw error when no authentication provided', () => {
      const config: DirectusConfig = {
        url: baseUrl,
      };
      expect(() => new DirectusClient(config)).toThrow(
        'Authentication configuration required'
      );
    });

    it('should remove trailing slash from URL', () => {
      const config: DirectusConfig = {
        url: `${baseUrl}/`,
        token: 'test-token',
      };
      const client = new DirectusClient(config);
      // Verify by making a request and checking the URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
      client.request('GET', '/test');
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/test`,
        expect.any(Object)
      );
    });
  });

  describe('authenticate', () => {
    beforeEach(() => {
      mockLogin.mockClear();
    });

    it('should authenticate with email/password', async () => {
      mockLogin.mockResolvedValue(undefined);

      const config: DirectusConfig = {
        url: baseUrl,
        email: 'test@example.com',
        password: 'test-password',
      };
      const client = new DirectusClient(config);
      await client.authenticate();
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'test-password');
    });

    it('should not authenticate when using token', async () => {
      const config: DirectusConfig = {
        url: baseUrl,
        token: 'test-token',
      };
      const client = new DirectusClient(config);
      await client.authenticate(); // Should not throw
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should throw error on authentication failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const config: DirectusConfig = {
        url: baseUrl,
        email: 'test@example.com',
        password: 'wrong-password',
      };
      const client = new DirectusClient(config);
      await expect(client.authenticate()).rejects.toThrow('Authentication failed');
    });
  });

  describe('request', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should make GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.request('GET', '/test');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/test`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should make POST request with body', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: 1, ...requestData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await client.request('POST', '/test', requestData);
      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should make PATCH request with body', async () => {
      const requestData = { name: 'Updated Item' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => requestData,
      });

      await client.request('PATCH', '/test', requestData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/test`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should make DELETE request with array body', async () => {
      const ids = [1, 2, 3];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      await client.request('DELETE', '/test', ids);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/test`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify(ids),
        })
      );
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      const result = await client.request('DELETE', '/test');
      expect(result).toEqual({ success: true });
    });

    it('should throw error on API error response', async () => {
      const errorData = {
        errors: [{ message: 'Not found' }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorData,
      });

      await expect(client.request('GET', '/test')).rejects.toThrow(
        'Directus API error: Not found'
      );
    });

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.request('GET', '/test')).rejects.toThrow(
        'Directus API error: Network error'
      );
    });
  });

  describe('Collections', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should get all collections', async () => {
      const mockData = { data: [{ collection: 'articles' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getCollections();
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/collections`,
        expect.any(Object)
      );
    });

    it('should get a collection', async () => {
      const mockData = { collection: 'articles' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getCollection('articles');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/collections/articles`,
        expect.any(Object)
      );
    });

    it('should create a collection', async () => {
      const collectionData = { collection: 'articles', meta: { icon: 'article' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => collectionData,
      });

      const result = await client.createCollection(collectionData);
      expect(result).toEqual(collectionData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/collections`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(collectionData),
        })
      );
    });

    it('should update a collection', async () => {
      const updateData = { meta: { icon: 'updated-icon' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updateData,
      });

      await client.updateCollection('articles', updateData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/collections/articles`,
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should delete a collection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      await client.deleteCollection('articles');
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/collections/articles`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Fields', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should get fields for a collection', async () => {
      const mockData = { data: [{ field: 'title', type: 'string' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getFields('articles');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/fields/articles`,
        expect.any(Object)
      );
    });

    it('should get a specific field', async () => {
      const mockData = { field: 'title', type: 'string' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getField('articles', 'title');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/fields/articles/title`,
        expect.any(Object)
      );
    });

    it('should create a field', async () => {
      const fieldData = { field: 'status', type: 'string' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => fieldData,
      });

      await client.createField('articles', fieldData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/fields/articles`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should update a field', async () => {
      const updateData = { meta: { required: true } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updateData,
      });

      await client.updateField('articles', 'title', updateData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/fields/articles/title`,
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should delete a field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      await client.deleteField('articles', 'title');
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/fields/articles/title`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Relations', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should get all relations', async () => {
      const mockData = { data: [{ id: 1, collection: 'articles' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getRelations();
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/relations`,
        expect.any(Object)
      );
    });

    it('should get a relation by ID', async () => {
      const mockData = { id: 1, collection: 'articles' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getRelation(1);
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/relations/1`,
        expect.any(Object)
      );
    });

    it('should create a relation', async () => {
      const relationData = {
        collection: 'articles',
        field: 'author',
        related_collection: 'users',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => relationData,
      });

      await client.createRelation(relationData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/relations`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should update a relation', async () => {
      const updateData = { meta: { one_deselect_action: 'nullify' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updateData,
      });

      await client.updateRelation(1, updateData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/relations/1`,
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should delete a relation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      await client.deleteRelation(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/relations/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Schema Snapshot', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should get schema snapshot', async () => {
      const mockData = {
        version: 1,
        directus: '10.0.0',
        vendor: 'postgres',
        collections: [
          { collection: 'articles', meta: { icon: 'article' } },
        ],
        fields: [
          { collection: 'articles', field: 'id', type: 'integer' },
          { collection: 'articles', field: 'title', type: 'string' },
        ],
        relations: [
          { collection: 'articles', field: 'author', related_collection: 'users' },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getSchemaSnapshot();
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/schema/snapshot`,
        expect.any(Object)
      );
    });
  });

  describe('Items', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should query items', async () => {
      const mockData = { data: [{ id: 1, title: 'Article' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.queryItems('articles', {
        filter: { status: { _eq: 'published' } },
        limit: 10,
      });
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${baseUrl}/items/articles`),
        expect.any(Object)
      );
    });

    it('should get an item', async () => {
      const mockData = { id: 1, title: 'Article' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getItem('articles', 1);
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/items/articles/1`,
        expect.any(Object)
      );
    });

    it('should create an item', async () => {
      const itemData = { title: 'New Article' };
      const responseData = { id: 1, ...itemData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await client.createItem('articles', itemData);
      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/items/articles`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should update an item', async () => {
      const updateData = { title: 'Updated Article' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updateData,
      });

      await client.updateItem('articles', 1, updateData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/items/articles/1`,
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should delete an item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      await client.deleteItem('articles', 1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/items/articles/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should bulk create items', async () => {
      const items = [{ title: 'Article 1' }, { title: 'Article 2' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: items }),
      });

      await client.bulkCreateItems('articles', items);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/items/articles`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(items),
        })
      );
    });

    it('should bulk update items', async () => {
      const items = [{ id: 1, title: 'Updated 1' }, { id: 2, title: 'Updated 2' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: items }),
      });

      await client.bulkUpdateItems('articles', items);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/items/articles`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(items),
        })
      );
    });

    it('should bulk delete items', async () => {
      const ids = [1, 2, 3];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      await client.bulkDeleteItems('articles', ids);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/items/articles`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify(ids),
        })
      );
    });
  });

  describe('Flows', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should list flows', async () => {
      const mockData = { data: [{ id: 'flow-1', name: 'Test Flow' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.listFlows({ limit: 10 });
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${baseUrl}/flows`),
        expect.any(Object)
      );
    });

    it('should get a flow', async () => {
      const mockData = { id: 'flow-1', name: 'Test Flow' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getFlow('flow-1');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows/flow-1`,
        expect.any(Object)
      );
    });

    it('should create a flow', async () => {
      const flowData = { name: 'New Flow', trigger: 'manual' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => flowData,
      });

      await client.createFlow(flowData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should create multiple flows', async () => {
      const flows = [
        { name: 'Flow 1', trigger: 'manual' },
        { name: 'Flow 2', trigger: 'webhook' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: flows }),
      });

      await client.createFlows(flows);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(flows),
        })
      );
    });

    it('should update a flow', async () => {
      const updateData = { status: 'inactive' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updateData,
      });

      await client.updateFlow('flow-1', updateData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows/flow-1`,
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should update multiple flows', async () => {
      const flows = [
        { id: 'flow-1', status: 'active' },
        { id: 'flow-2', status: 'inactive' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: flows }),
      });

      await client.updateFlows(flows);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(flows),
        })
      );
    });

    it('should delete a flow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      await client.deleteFlow('flow-1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows/flow-1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should delete multiple flows', async () => {
      const ids = ['flow-1', 'flow-2'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      await client.deleteFlows(ids);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify(ids),
        })
      );
    });

    it('should trigger a flow with GET', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.triggerFlow('GET', 'flow-1');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows/trigger/flow-1`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should trigger a flow with POST', async () => {
      const bodyData = { key: 'value' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => bodyData,
      });

      await client.triggerFlow('POST', 'flow-1', bodyData);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/flows/trigger/flow-1`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(bodyData),
        })
      );
    });
  });

  describe('buildQueryString', () => {
    let client: DirectusClient;

    beforeEach(() => {
      client = new DirectusClient({
        url: baseUrl,
        token: 'test-token',
      });
    });

    it('should build query string with fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { fields: ['id', 'title'] });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      // URLSearchParams encodes commas, so check for encoded version
      expect(callUrl).toContain('fields=');
      expect(decodeURIComponent(callUrl)).toContain('fields=id,title');
    });

    it('should build query string with filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', {
        filter: { status: { _eq: 'published' } },
      });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('filter=');
      expect(callUrl).toContain('status');
    });

    it('should build query string with search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { search: 'test query' });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('search=test+query');
    });

    it('should build query string with sort', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { sort: ['-date_created', 'title'] });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      // URLSearchParams encodes commas, so check for encoded version
      expect(callUrl).toContain('sort=');
      expect(decodeURIComponent(callUrl)).toContain('sort=-date_created,title');
    });

    it('should build query string with limit and offset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { limit: 10, offset: 20 });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('offset=20');
    });

    it('should build query string with page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { page: 2 });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('page=2');
    });

    it('should build query string with aggregate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { aggregate: { count: '*' } });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('aggregate=');
    });

    it('should build query string with groupBy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { groupBy: ['status', 'category'] });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      // URLSearchParams encodes commas, so check for encoded version
      expect(callUrl).toContain('groupBy=');
      expect(decodeURIComponent(callUrl)).toContain('groupBy=status,category');
    });

    it('should build query string with deep', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles', { deep: { author: { _limit: 1 } } });
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('deep=');
    });

    it('should return empty string when no params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.queryItems('articles');
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toBe(`${baseUrl}/items/articles`);
    });
  });

  describe('createDirectusClient', () => {
    it('should create and authenticate client', async () => {
      mockLogin.mockResolvedValue(undefined);

      const config: DirectusConfig = {
        url: baseUrl,
        email: 'test@example.com',
        password: 'test-password',
      };

      const client = await createDirectusClient(config);
      expect(client).toBeInstanceOf(DirectusClient);
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'test-password');
    });
  });
});

