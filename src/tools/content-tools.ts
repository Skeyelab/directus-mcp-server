import { z } from 'zod';
import { createTool, createActionTool } from './tool-helpers.js';
import {
  CollectionNameSchema,
  ItemIdSchema,
  FieldsSchema,
  FilterSchema,
  SearchSchema,
  SortSchema,
  LimitSchema,
  OffsetSchema,
  PageSchema,
  AggregateSchema,
  GroupBySchema,
  DeepSchema,
  AnyRecordSchema,
  ItemIdsArraySchema,
  ItemsArraySchema,
} from './validators.js';

// Zod schemas for validation
const QueryItemsSchema = z.object({
  collection: CollectionNameSchema.describe('Collection name to query'),
  fields: FieldsSchema,
  filter: FilterSchema,
  search: SearchSchema,
  sort: SortSchema,
  limit: LimitSchema,
  offset: OffsetSchema,
  page: PageSchema,
  aggregate: AggregateSchema,
  groupBy: GroupBySchema,
  deep: DeepSchema,
});

const GetItemSchema = z.object({
  collection: CollectionNameSchema,
  id: ItemIdSchema,
  fields: FieldsSchema,
  deep: DeepSchema,
});

const CreateItemSchema = z.object({
  collection: CollectionNameSchema,
  data: AnyRecordSchema,
});

const UpdateItemSchema = z.object({
  collection: CollectionNameSchema,
  id: ItemIdSchema.describe('Item ID to update'),
  data: AnyRecordSchema,
});

const DeleteItemSchema = z.object({
  collection: CollectionNameSchema,
  id: ItemIdSchema.describe('Item ID to delete'),
});

const BulkCreateItemsSchema = z.object({
  collection: CollectionNameSchema,
  items: ItemsArraySchema,
});

const BulkUpdateItemsSchema = z.object({
  collection: CollectionNameSchema,
  items: ItemsArraySchema.describe('Array of items with id and fields to update'),
});

const BulkDeleteItemsSchema = z.object({
  collection: CollectionNameSchema,
  ids: ItemIdsArraySchema,
});

// Tool implementations
export const contentTools = [
  createTool({
    name: 'query_items',
    description: 'Query items from a collection with advanced filtering, sorting, pagination, and search. Supports Directus filter operators like _eq, _neq, _lt, _lte, _gt, _gte, _in, _nin, _null, _nnull, _contains, _ncontains, _starts_with, _nstarts_with, _ends_with, _nends_with, _between, _nbetween. Example: {collection: "articles", filter: {"status": {"_eq": "published"}, "date_created": {"_gte": "2024-01-01"}}, sort: ["-date_created"], limit: 10}',
    inputSchema: QueryItemsSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => {
      const { collection, ...params } = args;
      return client.queryItems(collection, params);
    },
  }),
  createTool({
    name: 'get_item',
    description: 'Get a single item by ID from a collection. Optionally specify fields to return and deep query for relational data.',
    inputSchema: GetItemSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => {
      const { collection, id, ...params } = args;
      return client.getItem(collection, id, params);
    },
  }),
  createTool({
    name: 'create_item',
    description: 'Create a new item in a collection. Provide the item data as key-value pairs. Example: {collection: "articles", data: {title: "My Article", status: "draft", body: "Article content..."}}',
    inputSchema: CreateItemSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => client.createItem(args.collection, args.data),
  }),
  createTool({
    name: 'update_item',
    description: 'Update an existing item in a collection. Provide the item ID and fields to update. Example: {collection: "articles", id: 1, data: {status: "published"}}',
    inputSchema: UpdateItemSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => client.updateItem(args.collection, args.id, args.data),
  }),
  createActionTool({
    name: 'delete_item',
    description: 'Delete an item from a collection by ID. This action cannot be undone.',
    inputSchema: DeleteItemSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => client.deleteItem(args.collection, args.id),
    successMessage: (args) => `Item ${args.id} deleted from collection "${args.collection}"`,
  }),
  createTool({
    name: 'bulk_create_items',
    description: 'Create multiple items in a collection at once. More efficient than creating items one by one. Example: {collection: "articles", items: [{title: "Article 1", status: "draft"}, {title: "Article 2", status: "draft"}]}',
    inputSchema: BulkCreateItemsSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => client.bulkCreateItems(args.collection, args.items),
  }),
  createTool({
    name: 'bulk_update_items',
    description: 'Update multiple items in a collection at once. Each item must include an id field. Example: {collection: "articles", items: [{id: 1, status: "published"}, {id: 2, status: "published"}]}',
    inputSchema: BulkUpdateItemsSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => client.bulkUpdateItems(args.collection, args.items),
  }),
  createActionTool({
    name: 'bulk_delete_items',
    description: 'Delete multiple items from a collection at once by their IDs. This action cannot be undone. Example: {collection: "articles", ids: [1, 2, 3]}',
    inputSchema: BulkDeleteItemsSchema,
    toolsets: ['default', 'content'],
    handler: async (client, args) => client.bulkDeleteItems(args.collection, args.ids),
    successMessage: (args) => `${args.ids.length} items deleted from collection "${args.collection}"`,
  }),
];

