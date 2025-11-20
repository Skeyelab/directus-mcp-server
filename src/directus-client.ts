import { createDirectus, rest, authentication, staticToken } from '@directus/sdk';
import { DirectusConfig } from './types/index.js';

export class DirectusClient {
  private client: any;
  private config: DirectusConfig;
  private baseUrl: string;
  private authHeaders: { Authorization?: string } = {};

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
    return this.request('GET', '/collections');
  }

  async getCollection(name: string): Promise<any> {
    return this.request('GET', `/collections/${name}`);
  }

  async createCollection(data: any): Promise<any> {
    return this.request('POST', '/collections', data);
  }

  async updateCollection(name: string, data: any): Promise<any> {
    return this.request('PATCH', `/collections/${name}`, data);
  }

  async deleteCollection(name: string): Promise<any> {
    return this.request('DELETE', `/collections/${name}`);
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
    return this.request('GET', '/relations');
  }

  async getRelation(id: number): Promise<any> {
    return this.request('GET', `/relations/${id}`);
  }

  async createRelation(data: any): Promise<any> {
    return this.request('POST', '/relations', data);
  }

  async updateRelation(id: number, data: any): Promise<any> {
    return this.request('PATCH', `/relations/${id}`, data);
  }

  async deleteRelation(id: number): Promise<any> {
    return this.request('DELETE', `/relations/${id}`);
  }

  // Schema Snapshot
  async getSchemaSnapshot(): Promise<any> {
    return this.request('GET', '/schema/snapshot');
  }

  // Items
  async queryItems(collection: string, params?: any): Promise<any> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request('GET', `/items/${collection}${queryString}`);
  }

  async getItem(collection: string, id: string | number, params?: any): Promise<any> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request('GET', `/items/${collection}/${id}${queryString}`);
  }

  async createItem(collection: string, data: any): Promise<any> {
    return this.request('POST', `/items/${collection}`, data);
  }

  async updateItem(collection: string, id: string | number, data: any): Promise<any> {
    return this.request('PATCH', `/items/${collection}/${id}`, data);
  }

  async deleteItem(collection: string, id: string | number): Promise<any> {
    return this.request('DELETE', `/items/${collection}/${id}`);
  }

  async bulkCreateItems(collection: string, items: any[]): Promise<any> {
    return this.request('POST', `/items/${collection}`, items);
  }

  async bulkUpdateItems(collection: string, items: any[]): Promise<any> {
    return this.request('PATCH', `/items/${collection}`, items);
  }

  async bulkDeleteItems(collection: string, ids: (string | number)[]): Promise<any> {
    return this.request('DELETE', `/items/${collection}`, ids);
  }

  // Flows
  async listFlows(params?: any): Promise<any> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request('GET', `/flows${queryString}`);
  }

  async getFlow(id: string, params?: any): Promise<any> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request('GET', `/flows/${id}${queryString}`);
  }

  async createFlow(data: any): Promise<any> {
    return this.request('POST', '/flows', data);
  }

  async createFlows(flows: any[]): Promise<any> {
    return this.request('POST', '/flows', flows);
  }

  async updateFlow(id: string, data: any): Promise<any> {
    return this.request('PATCH', `/flows/${id}`, data);
  }

  async updateFlows(flows: any[]): Promise<any> {
    return this.request('PATCH', '/flows', flows);
  }

  async deleteFlow(id: string): Promise<any> {
    return this.request('DELETE', `/flows/${id}`);
  }

  async deleteFlows(ids: string[]): Promise<any> {
    return this.request('DELETE', '/flows', ids);
  }

  async triggerFlow(method: 'GET' | 'POST', id: string, bodyData?: any, queryParams?: any): Promise<any> {
    const queryString = queryParams ? this.buildQueryString(queryParams) : '';
    const endpoint = `/flows/trigger/${id}${queryString}`;

    if (method === 'POST') {
      return this.request('POST', endpoint, bodyData);
    } else {
      return this.request('GET', endpoint);
    }
  }

  private buildQueryString(params: any): string {
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

    const query = queryParams.toString();
    return query ? `?${query}` : '';
  }
}

export async function createDirectusClient(config: DirectusConfig): Promise<DirectusClient> {
  const client = new DirectusClient(config);
  await client.authenticate();
  return client;
}

