import { z } from 'zod';
import { createTool, createActionTool } from './tool-helpers.js';
import {
  UuidSchema,
  FieldsSchema,
  FilterSchema,
  SearchSchema,
  SortSchema,
  LimitSchema,
  OffsetSchema,
  MetaSchema,
  AnyRecordSchema,
} from './validators.js';

// Operation types enum (from Directus API docs)
export const OperationTypeSchema = z.enum([
  'log',
  'mail',
  'notification',
  'create',
  'read',
  'request',
  'sleep',
  'transform',
  'trigger',
  'condition'
]).describe('Type of operation. One of log, mail, notification, create, read, request, sleep, transform, trigger, condition, or any type of custom operation extensions');

// Zod schemas for validation
const ListOperationsSchema = z.object({
  fields: FieldsSchema,
  filter: FilterSchema,
  search: SearchSchema,
  sort: SortSchema,
  limit: LimitSchema,
  offset: OffsetSchema,
  meta: MetaSchema,
});

const GetOperationSchema = z.object({
  id: UuidSchema.describe('Operation ID (UUID)'),
  fields: FieldsSchema,
  meta: MetaSchema,
});

const CreateOperationSchema = z.object({
  name: z.string().min(1).describe('The name of the operation'),
  key: z.string().min(1).describe('Key for the operation. Must be unique within a given flow'),
  type: OperationTypeSchema,
  position_x: z.number().optional().describe('Position of the operation on the X axis within the flow workspace'),
  position_y: z.number().optional().describe('Position of the operation on the Y axis within the flow workspace'),
  options: AnyRecordSchema.optional().describe('Options depending on the type of the operation'),
  resolve: UuidSchema.optional().describe('The operation triggered when the current operation succeeds (or then logic of a condition operation)'),
  reject: UuidSchema.optional().describe('The operation triggered when the current operation fails (or otherwise logic of a condition operation)'),
  flow: UuidSchema.optional().describe('UUID of the flow this operation belongs to'),
});

const CreateOperationsSchema = z.object({
  operations: z.array(CreateOperationSchema).describe('Array of operations to create'),
});

const UpdateOperationSchema = z.object({
  id: UuidSchema.describe('Operation ID (UUID) to update'),
  name: z.string().optional().describe('The name of the operation'),
  key: z.string().optional().describe('Key for the operation. Must be unique within a given flow'),
  type: OperationTypeSchema.optional(),
  position_x: z.number().optional().describe('Position of the operation on the X axis within the flow workspace'),
  position_y: z.number().optional().describe('Position of the operation on the Y axis within the flow workspace'),
  options: AnyRecordSchema.optional().describe('Options depending on the type of the operation'),
  resolve: UuidSchema.optional().describe('The operation triggered when the current operation succeeds (or then logic of a condition operation)'),
  reject: UuidSchema.optional().describe('The operation triggered when the current operation fails (or otherwise logic of a condition operation)'),
  flow: UuidSchema.optional().describe('UUID of the flow this operation belongs to'),
});

const UpdateOperationsSchema = z.object({
  operations: z.array(UpdateOperationSchema).describe('Array of operations to update (each must include id)'),
});

const DeleteOperationSchema = z.object({
  id: UuidSchema.describe('Operation ID (UUID) to delete'),
});

const DeleteOperationsSchema = z.object({
  ids: z.array(z.string()).describe('Array of operation IDs (UUIDs) to delete'),
});

// Tool implementations
export const operationTools = [
  createTool({
    name: 'list_operations',
    description: 'List all operations that exist in Directus. Supports filtering, sorting, pagination, and search. Example: {filter: {"flow": {"_eq": "flow-uuid"}}, sort: ["-date_created"], limit: 10}',
    inputSchema: ListOperationsSchema,
    toolsets: ['flow'],
    handler: (client, args) => client.listOperations(args),
  }),
  createTool({
    name: 'get_operation',
    description: 'Get a single operation by ID from Directus. Optionally specify fields to return and metadata options.',
    inputSchema: GetOperationSchema,
    toolsets: ['flow'],
    handler: async (client, args) => {
      const { id, ...params } = args;
      return client.getOperation(id, params);
    },
  }),
  createTool({
    name: 'create_operation',
    description: 'Create a new operation in Directus. Provide the operation data including name, key, type, and optional configuration. Example: {name: "Log to Console", key: "log_console", type: "log", position_x: 12, position_y: 12}',
    inputSchema: CreateOperationSchema,
    toolsets: ['flow'],
    handler: (client, args) => client.createOperation(args),
  }),
  createTool({
    name: 'create_operations',
    description: 'Create multiple operations in Directus at once. More efficient than creating operations one by one. Example: {operations: [{name: "Op 1", key: "op1", type: "log"}, {name: "Op 2", key: "op2", type: "transform"}]}',
    inputSchema: CreateOperationsSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.createOperations(args.operations),
  }),
  createTool({
    name: 'update_operation',
    description: 'Update an existing operation in Directus. Provide the operation ID and fields to update. Example: {id: "operation-uuid", name: "Updated Operation Name", position_x: 24}',
    inputSchema: UpdateOperationSchema,
    toolsets: ['flow'],
    handler: async (client, args) => {
      const { id, ...data } = args;
      return client.updateOperation(id, data);
    },
  }),
  createTool({
    name: 'update_operations',
    description: 'Update multiple operations in Directus at once. Each operation must include an id field. Example: {operations: [{id: "uuid-1", position_x: 10}, {id: "uuid-2", position_y: 20}]}',
    inputSchema: UpdateOperationsSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.updateOperations(args.operations),
  }),
  createActionTool({
    name: 'delete_operation',
    description: 'Delete an operation from Directus by ID. This action cannot be undone.',
    inputSchema: DeleteOperationSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.deleteOperation(args.id),
    successMessage: (args) => `Operation ${args.id} deleted successfully`,
  }),
  createActionTool({
    name: 'delete_operations',
    description: 'Delete multiple operations from Directus at once by their IDs. This action cannot be undone. Example: {ids: ["uuid-1", "uuid-2", "uuid-3"]}',
    inputSchema: DeleteOperationsSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.deleteOperations(args.ids),
    successMessage: (args) => `${args.ids.length} operations deleted successfully`,
  }),
];
