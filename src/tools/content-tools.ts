import { z } from 'zod';
import { DirectusClient } from '../directus-client.js';

// Zod schemas for validation
const QueryItemsSchema = z.object({
  collection: z.string().min(1).describe('Collection name to query'),
  fields: z.array(z.string()).optional().describe('Fields to return (e.g., ["id", "title", "status"])'),
  filter: z.record(z.any()).optional().describe('Filter object using Directus filter syntax (e.g., {"status": {"_eq": "published"}})'),
  search: z.string().optional().describe('Search query string'),
  sort: z.array(z.string()).optional().describe('Sort fields (prefix with - for descending, e.g., ["-date_created", "title"])'),
  limit: z.number().optional().describe('Maximum number of items to return'),
  offset: z.number().optional().describe('Number of items to skip'),
  page: z.number().optional().describe('Page number (alternative to offset)'),
  aggregate: z.record(z.any()).optional().describe('Aggregation functions (e.g., {"count": "*"})'),
  groupBy: z.array(z.string()).optional().describe('Fields to group by'),
  deep: z.record(z.any()).optional().describe('Deep query for relational data'),
});

const GetItemSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  id: z.union([z.string(), z.number()]).describe('Item ID'),
  fields: z.array(z.string()).optional().describe('Fields to return'),
  deep: z.record(z.any()).optional().describe('Deep query for relational data'),
});

const CreateItemSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  data: z.record(z.any()).describe('Item data as key-value pairs'),
});

const UpdateItemSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  id: z.union([z.string(), z.number()]).describe('Item ID to update'),
  data: z.record(z.any()).describe('Fields to update as key-value pairs'),
});

const DeleteItemSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  id: z.union([z.string(), z.number()]).describe('Item ID to delete'),
});

const BulkCreateItemsSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  items: z.array(z.record(z.any())).describe('Array of items to create'),
});

const BulkUpdateItemsSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  items: z.array(z.record(z.any())).describe('Array of items with id and fields to update'),
});

const BulkDeleteItemsSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  ids: z.array(z.union([z.string(), z.number()])).describe('Array of item IDs to delete'),
});

// Tool implementations
export const contentTools = [
  {
    name: 'query_items',
    description: 'Query items from a collection with advanced filtering, sorting, pagination, and search. Supports Directus filter operators like _eq, _neq, _lt, _lte, _gt, _gte, _in, _nin, _null, _nnull, _contains, _ncontains, _starts_with, _nstarts_with, _ends_with, _nends_with, _between, _nbetween. Example: {collection: "articles", filter: {"status": {"_eq": "published"}, "date_created": {"_gte": "2024-01-01"}}, sort: ["-date_created"], limit: 10}',
    inputSchema: QueryItemsSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { collection, ...params } = args;
      const result = await client.queryItems(collection, params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'get_item',
    description: 'Get a single item by ID from a collection. Optionally specify fields to return and deep query for relational data.',
    inputSchema: GetItemSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { collection, id, ...params } = args;
      const result = await client.getItem(collection, id, params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'create_item',
    description: 'Create a new item in a collection. Provide the item data as key-value pairs. Example: {collection: "articles", data: {title: "My Article", status: "draft", body: "Article content..."}}',
    inputSchema: CreateItemSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.createItem(args.collection, args.data);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'update_item',
    description: 'Update an existing item in a collection. Provide the item ID and fields to update. Example: {collection: "articles", id: 1, data: {status: "published"}}',
    inputSchema: UpdateItemSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.updateItem(args.collection, args.id, args.data);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'delete_item',
    description: 'Delete an item from a collection by ID. This action cannot be undone.',
    inputSchema: DeleteItemSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      await client.deleteItem(args.collection, args.id);
      return {
        content: [
          {
            type: 'text',
            text: `Item ${args.id} deleted from collection "${args.collection}"`,
          },
        ],
      };
    },
  },
  {
    name: 'bulk_create_items',
    description: 'Create multiple items in a collection at once. More efficient than creating items one by one. Example: {collection: "articles", items: [{title: "Article 1", status: "draft"}, {title: "Article 2", status: "draft"}]}',
    inputSchema: BulkCreateItemsSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.bulkCreateItems(args.collection, args.items);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'bulk_update_items',
    description: 'Update multiple items in a collection at once. Each item must include an id field. Example: {collection: "articles", items: [{id: 1, status: "published"}, {id: 2, status: "published"}]}',
    inputSchema: BulkUpdateItemsSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.bulkUpdateItems(args.collection, args.items);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'bulk_delete_items',
    description: 'Delete multiple items from a collection at once by their IDs. This action cannot be undone. Example: {collection: "articles", ids: [1, 2, 3]}',
    inputSchema: BulkDeleteItemsSchema,
    toolsets: ['default', 'content'] as const,
    handler: async (client: DirectusClient, args: any) => {
      await client.bulkDeleteItems(args.collection, args.ids);
      return {
        content: [
          {
            type: 'text',
            text: `${args.ids.length} items deleted from collection "${args.collection}"`,
          },
        ],
      };
    },
  },
];

