import { createDirectus, rest, authentication, staticToken } from '@directus/sdk';
import { DirectusConfig } from './types/index.js';

// Resource factory for common CRUD patterns
function createResourceMethods(basePath: string, options: {
  supportsBulk?: boolean;
  specialMethods?: Record<string, (client: DirectusClient, ...args: any[]) => Promise<any>>;
} = {}) {
  const { supportsBulk = false, specialMethods = {} } = options;
  const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;

  return {
    // List/query operations
    list: function(client: DirectusClient, params?: any) {
      const queryString = params ? client.buildQueryString(params) : '';
      return client.request('GET', `${normalizedBasePath}${queryString}`);
    },

    // Get single item
    get: function(client: DirectusClient, id: string | number, params?: any) {
      const queryString = params ? client.buildQueryString(params) : '';
      return client.request('GET', `${normalizedBasePath}/${id}${queryString}`);
    },

    // Create single item
    create: function(client: DirectusClient, data: any) {
      return client.request('POST', normalizedBasePath, data);
    },

    // Update single item
    update: function(client: DirectusClient, id: string | number, data: any) {
      return client.request('PATCH', `${normalizedBasePath}/${id}`, data);
    },

    // Delete single item
    delete: function(client: DirectusClient, id: string | number) {
      return client.request('DELETE', `${normalizedBasePath}/${id}`);
    },

    // Bulk operations (if supported)
    ...(supportsBulk && {
      bulkCreate: function(client: DirectusClient, items: any[]) {
        return client.request('POST', normalizedBasePath, items);
      },

      bulkUpdate: function(client: DirectusClient, items: any[]) {
        return client.request('PATCH', normalizedBasePath, items);
      },

      bulkDelete: function(client: DirectusClient, ids: (string | number)[]) {
        return client.request('DELETE', normalizedBasePath, ids);
      },
    }),

    // Special methods
    ...Object.fromEntries(
      Object.entries(specialMethods).map(([name, method]) => [
        name,
        (client: DirectusClient, ...args: any[]) => method(client, ...args)
      ])
    )
  };
}

export class DirectusClient {
  private client: any;
  private config: DirectusConfig;
  private baseUrl: string;
  private authHeaders: { Authorization?: string } = {};

  // Resource factories
  private collections = createResourceMethods('collections');
  private relations = createResourceMethods('relations');
  private items = createResourceMethods('', {
    supportsBulk: true,
    specialMethods: {
      query: (client: DirectusClient, collection: string, params?: any) => {
        const queryString = params ? client.buildQueryString(params) : '';
        return client.request('GET', `/items/${collection}${queryString}`);
      },
      get: (client: DirectusClient, collection: string, id: string | number, params?: any) => {
        const queryString = params ? client.buildQueryString(params) : '';
        return client.request('GET', `/items/${collection}/${id}${queryString}`);
      },
      create: (client: DirectusClient, collection: string, data: any) => {
        return client.request('POST', `/items/${collection}`, data);
      },
      update: (client: DirectusClient, collection: string, id: string | number, data: any) => {
        return client.request('PATCH', `/items/${collection}/${id}`, data);
      },
      delete: (client: DirectusClient, collection: string, id: string | number) => {
        return client.request('DELETE', `/items/${collection}/${id}`);
      },
      bulkCreate: (client: DirectusClient, collection: string, items: any[]) => {
        return client.request('POST', `/items/${collection}`, items);
      },
      bulkUpdate: (client: DirectusClient, collection: string, items: any[]) => {
        return client.request('PATCH', `/items/${collection}`, items);
      },
      bulkDelete: (client: DirectusClient, collection: string, ids: (string | number)[]) => {
        return client.request('DELETE', `/items/${collection}`, ids);
      }
    }
  });
  private flows = createResourceMethods('flows', {
    supportsBulk: true,
    specialMethods: {
      list: (client: DirectusClient, params?: any) => {
        const queryString = params ? client.buildQueryString(params) : '';
        return client.request('GET', `/flows${queryString}`);
      },
      get: (client: DirectusClient, id: string, params?: any) => {
        const queryString = params ? client.buildQueryString(params) : '';
        return client.request('GET', `/flows/${id}${queryString}`);
      },
      create: (client: DirectusClient, data: any) => {
        return client.request('POST', '/flows', data);
      },
      createFlows: (client: DirectusClient, flows: any[]) => {
        return client.request('POST', '/flows', flows);
      },
      update: (client: DirectusClient, id: string, data: any) => {
        return client.request('PATCH', `/flows/${id}`, data);
      },
      updateFlows: (client: DirectusClient, flows: any[]) => {
        return client.request('PATCH', '/flows', flows);
      },
      delete: (client: DirectusClient, id: string) => {
        return client.request('DELETE', `/flows/${id}`);
      },
      deleteFlows: (client: DirectusClient, ids: string[]) => {
        return client.request('DELETE', '/flows', ids);
      },
      triggerFlow: (client: DirectusClient, method: 'GET' | 'POST', id: string, bodyData?: any, queryParams?: any) => {
        const queryString = queryParams ? client.buildQueryString(queryParams) : '';
        const endpoint = `/flows/trigger/${id}${queryString}`;
        if (method === 'POST') {
          return client.request('POST', endpoint, bodyData);
        } else {
          return client.request('GET', endpoint);
        }
      }
    }
  });

  private operations = createResourceMethods('operations', {
    supportsBulk: true,
    specialMethods: {
      list: (client: DirectusClient, params?: any) => {
        const queryString = params ? client.buildQueryString(params) : '';
        return client.request('GET', `/operations${queryString}`);
      },
      get: (client: DirectusClient, id: string, params?: any) => {
        const queryString = params ? client.buildQueryString(params) : '';
        return client.request('GET', `/operations/${id}${queryString}`);
      },
      create: (client: DirectusClient, data: any) => {
        return client.request('POST', '/operations', data);
      },
      createOperations: (client: DirectusClient, operations: any[]) => {
        return client.request('POST', '/operations', operations);
      },
      update: (client: DirectusClient, id: string, data: any) => {
        return client.request('PATCH', `/operations/${id}`, data);
      },
      updateOperations: (client: DirectusClient, operations: any[]) => {
        return client.request('PATCH', '/operations', operations);
      },
      delete: (client: DirectusClient, id: string) => {
        return client.request('DELETE', `/operations/${id}`);
      },
      deleteOperations: (client: DirectusClient, ids: string[]) => {
        return client.request('DELETE', '/operations', ids);
      }
    }
  });

  constructor(config: DirectusConfig) {
    this.config = config;
    this.baseUrl = config.url.replace(/\/$/, ''); // Remove trailing slash
    this.client = this.initializeClient();
  }

  private initializeClient() {
    const client = createDirectus(this.config.url).with(rest());

    if (this.config.token) {
      this.authHeaders.Authorization = `Bearer ${this.config.token}`;
      return client.with(staticToken(this.config.token));
    } else if (this.config.email && this.config.password) {
      return client.with(authentication('json'));
    }

    throw new Error('Authentication configuration required: provide either token or email/password');
  }

  async authenticate(): Promise<void> {
    if (this.config.email && this.config.password) {
      try {
        await this.client.login(this.config.email, this.config.password);
      } catch (error) {
        throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async request(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: any = {
        'Content-Type': 'application/json',
        ...this.authHeaders,
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      } else if (data && method === 'DELETE' && Array.isArray(data)) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        const errorMessage = errorData?.errors?.[0]?.message || errorData?.message || response.statusText;
        throw new Error(`Directus API error: ${errorMessage}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error: any) {
      if (error.message.includes('Directus API error:')) {
        throw error;
      }
      const errorMessage = error?.errors?.[0]?.message || error?.message || String(error);
      throw new Error(`Directus API error: ${errorMessage}`);
    }
  }

  // Collections
  async getCollections(): Promise<any> {
    return this.collections.list(this);
  }

  async getCollection(name: string): Promise<any> {
    return this.collections.get(this, name);
  }

  async createCollection(data: any): Promise<any> {
    return this.collections.create(this, data);
  }

  async updateCollection(name: string, data: any): Promise<any> {
    return this.collections.update(this, name, data);
  }

  async deleteCollection(name: string): Promise<any> {
    return this.collections.delete(this, name);
  }

  // Fields
  async getFields(collection: string): Promise<any> {
    return this.request('GET', `/fields/${collection}`);
  }

  async getField(collection: string, field: string): Promise<any> {
    return this.request('GET', `/fields/${collection}/${field}`);
  }

  async createField(collection: string, data: any): Promise<any> {
    return this.request('POST', `/fields/${collection}`, data);
  }

  async updateField(collection: string, field: string, data: any): Promise<any> {
    return this.request('PATCH', `/fields/${collection}/${field}`, data);
  }

  async deleteField(collection: string, field: string): Promise<any> {
    return this.request('DELETE', `/fields/${collection}/${field}`);
  }

  // Relations
  async getRelations(): Promise<any> {
    return this.relations.list(this);
  }

  async getRelation(id: number): Promise<any> {
    return this.relations.get(this, id);
  }

  async createRelation(data: any): Promise<any> {
    return this.relations.create(this, data);
  }

  async updateRelation(id: number, data: any): Promise<any> {
    return this.relations.update(this, id, data);
  }

  async deleteRelation(id: number): Promise<any> {
    return this.relations.delete(this, id);
  }

  // Schema
  async getSchemaSnapshot(params?: { export?: 'csv' | 'json' | 'xml' | 'yaml' }): Promise<any> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request('GET', `/schema/snapshot${queryString}`);
  }

  async getSchemaDiff(snapshot: any, options?: { force?: boolean }): Promise<any> {
    const queryString = options?.force ? '?force=true' : '';
    return this.request('POST', `/schema/diff${queryString}`, snapshot);
  }

  async applySchemaDiff(diff: any): Promise<any> {
    return this.request('POST', '/schema/apply', diff);
  }

  // Items
  async queryItems(collection: string, params?: any): Promise<any> {
    return (this.items as any).query(this, collection, params);
  }

  async getItem(collection: string, id: string | number, params?: any): Promise<any> {
    return (this.items as any).get(this, collection, id, params);
  }

  async createItem(collection: string, data: any): Promise<any> {
    return (this.items as any).create(this, collection, data);
  }

  async updateItem(collection: string, id: string | number, data: any): Promise<any> {
    return (this.items as any).update(this, collection, id, data);
  }

  async deleteItem(collection: string, id: string | number): Promise<any> {
    return (this.items as any).delete(this, collection, id);
  }

  async bulkCreateItems(collection: string, items: any[]): Promise<any> {
    return (this.items as any).bulkCreate(this, collection, items);
  }

  async bulkUpdateItems(collection: string, items: any[]): Promise<any> {
    return (this.items as any).bulkUpdate(this, collection, items);
  }

  async bulkDeleteItems(collection: string, ids: (string | number)[]): Promise<any> {
    return (this.items as any).bulkDelete(this, collection, ids);
  }

  // Flows
  async listFlows(params?: any): Promise<any> {
    return (this.flows as any).list(this, params);
  }

  async getFlow(id: string, params?: any): Promise<any> {
    return (this.flows as any).get(this, id, params);
  }

  async createFlow(data: any): Promise<any> {
    return (this.flows as any).create(this, data);
  }

  async createFlows(flows: any[]): Promise<any> {
    return (this.flows as any).createFlows(this, flows);
  }

  async updateFlow(id: string, data: any): Promise<any> {
    return (this.flows as any).update(this, id, data);
  }

  async updateFlows(flows: any[]): Promise<any> {
    return (this.flows as any).updateFlows(this, flows);
  }

  async deleteFlow(id: string): Promise<any> {
    return (this.flows as any).delete(this, id);
  }

  async deleteFlows(ids: string[]): Promise<any> {
    return (this.flows as any).deleteFlows(this, ids);
  }

  async triggerFlow(method: 'GET' | 'POST', id: string, bodyData?: any, queryParams?: any): Promise<any> {
    return (this.flows as any).triggerFlow(this, method, id, bodyData, queryParams);
  }

  // Operations
  async listOperations(params?: any): Promise<any> {
    return (this.operations as any).list(this, params);
  }

  async getOperation(id: string, params?: any): Promise<any> {
    return (this.operations as any).get(this, id, params);
  }

  async createOperation(data: any): Promise<any> {
    return (this.operations as any).create(this, data);
  }

  async createOperations(operations: any[]): Promise<any> {
    return (this.operations as any).createOperations(this, operations);
  }

  async updateOperation(id: string, data: any): Promise<any> {
    return (this.operations as any).update(this, id, data);
  }

  async updateOperations(operations: any[]): Promise<any> {
    return (this.operations as any).updateOperations(this, operations);
  }

  async deleteOperation(id: string): Promise<any> {
    return (this.operations as any).delete(this, id);
  }

  async deleteOperations(ids: string[]): Promise<any> {
    return (this.operations as any).deleteOperations(this, ids);
  }

  public buildQueryString(params: any): string {
    const queryParams = new URLSearchParams();

    if (params.fields) {
      queryParams.append('fields', Array.isArray(params.fields) ? params.fields.join(',') : params.fields);
    }

    if (params.filter) {
      queryParams.append('filter', JSON.stringify(params.filter));
    }

    if (params.search) {
      queryParams.append('search', params.search);
    }

    if (params.sort) {
      queryParams.append('sort', Array.isArray(params.sort) ? params.sort.join(',') : params.sort);
    }

    if (params.limit !== undefined) {
      queryParams.append('limit', String(params.limit));
    }

    if (params.offset !== undefined) {
      queryParams.append('offset', String(params.offset));
    }

    if (params.page !== undefined) {
      queryParams.append('page', String(params.page));
    }

    if (params.aggregate) {
      queryParams.append('aggregate', JSON.stringify(params.aggregate));
    }

    if (params.groupBy) {
      queryParams.append('groupBy', Array.isArray(params.groupBy) ? params.groupBy.join(',') : params.groupBy);
    }

    if (params.deep) {
      queryParams.append('deep', JSON.stringify(params.deep));
    }

    if (params.meta) {
      queryParams.append('meta', params.meta);
    }

    if (params.export) {
      queryParams.append('export', params.export);
    }

    const query = queryParams.toString();
    return query ? `?${query}` : '';
  }
}

export async function createDirectusClient(config: DirectusConfig): Promise<DirectusClient> {
  const client = new DirectusClient(config);
  await client.authenticate();
  return client;
}

