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
  FlowTriggerSchema,
  FlowStatusSchema,
  FlowAccountabilitySchema,
  AnyRecordSchema,
  HttpMethodSchema,
} from './validators.js';

// Zod schemas for validation
const ListFlowsSchema = z.object({
  fields: FieldsSchema,
  filter: FilterSchema,
  search: SearchSchema,
  sort: SortSchema,
  limit: LimitSchema,
  offset: OffsetSchema,
  meta: MetaSchema,
});

const GetFlowSchema = z.object({
  id: UuidSchema.describe('Flow ID (UUID)'),
  fields: FieldsSchema,
  meta: MetaSchema,
});

const CreateFlowSchema = z.object({
  name: z.string().min(1).describe('The name of the flow'),
  icon: z.string().optional().describe('Icon displayed in the Admin App for the flow'),
  color: z.string().optional().describe('Color of the icon displayed in the Admin App for the flow'),
  description: z.string().optional().describe('Description of the flow'),
  status: FlowStatusSchema.optional(),
  trigger: FlowTriggerSchema,
  accountability: FlowAccountabilitySchema,
  options: AnyRecordSchema.optional(),
  operation: z.string().optional().describe('UUID of the operation connected to the trigger in the flow'),
});

const CreateFlowsSchema = z.object({
  flows: z.array(CreateFlowSchema).describe('Array of flows to create'),
});

const UpdateFlowSchema = z.object({
  id: UuidSchema.describe('Flow ID (UUID) to update'),
  name: z.string().optional().describe('The name of the flow'),
  icon: z.string().optional().describe('Icon displayed in the Admin App for the flow'),
  color: z.string().optional().describe('Color of the icon displayed in the Admin App for the flow'),
  description: z.string().optional().describe('Description of the flow'),
  status: FlowStatusSchema.optional(),
  trigger: FlowTriggerSchema.optional(),
  accountability: FlowAccountabilitySchema,
  options: AnyRecordSchema.optional(),
  operation: z.string().optional().describe('UUID of the operation connected to the trigger in the flow'),
});

const UpdateFlowsSchema = z.object({
  flows: z.array(UpdateFlowSchema).describe('Array of flows to update (each must include id)'),
});

const DeleteFlowSchema = z.object({
  id: UuidSchema.describe('Flow ID (UUID) to delete'),
});

const DeleteFlowsSchema = z.object({
  ids: z.array(z.string()).describe('Array of flow IDs (UUIDs) to delete'),
});

const TriggerFlowSchema = z.object({
  id: UuidSchema.describe('Flow ID (UUID) to trigger'),
  method: HttpMethodSchema.optional().default('GET'),
  data: AnyRecordSchema.optional(),
  fields: FieldsSchema,
  meta: MetaSchema,
});

// Tool implementations
export const flowTools = [
  createTool({
    name: 'list_flows',
    description: 'List all flows that exist in Directus. Supports filtering, sorting, pagination, and search. Example: {filter: {"status": {"_eq": "active"}}, sort: ["-date_created"], limit: 10}',
    inputSchema: ListFlowsSchema,
    toolsets: ['flow'],
    handler: (client, args) => client.listFlows(args),
  }),
  createTool({
    name: 'get_flow',
    description: 'Get a single flow by ID from Directus. Optionally specify fields to return and metadata options.',
    inputSchema: GetFlowSchema,
    toolsets: ['flow'],
    handler: async (client, args) => {
      const { id, ...params } = args;
      return client.getFlow(id, params);
    },
  }),
  createTool({
    name: 'create_flow',
    description: 'Create a new flow in Directus. Provide the flow data including name, trigger type, and optional configuration. Example: {name: "Update Articles Flow", trigger: "manual", status: "active", accountability: "$trigger"}',
    inputSchema: CreateFlowSchema,
    toolsets: ['flow'],
    handler: (client, args) => client.createFlow(args),
  }),
  createTool({
    name: 'create_flows',
    description: 'Create multiple flows in Directus at once. More efficient than creating flows one by one. Example: {flows: [{name: "Flow 1", trigger: "manual"}, {name: "Flow 2", trigger: "webhook"}]}',
    inputSchema: CreateFlowsSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.createFlows(args.flows),
  }),
  createTool({
    name: 'update_flow',
    description: 'Update an existing flow in Directus. Provide the flow ID and fields to update. Example: {id: "flow-uuid", status: "inactive", name: "Updated Flow Name"}',
    inputSchema: UpdateFlowSchema,
    toolsets: ['flow'],
    handler: async (client, args) => {
      const { id, ...data } = args;
      return client.updateFlow(id, data);
    },
  }),
  createTool({
    name: 'update_flows',
    description: 'Update multiple flows in Directus at once. Each flow must include an id field. Example: {flows: [{id: "uuid-1", status: "active"}, {id: "uuid-2", status: "inactive"}]}',
    inputSchema: UpdateFlowsSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.updateFlows(args.flows),
  }),
  createActionTool({
    name: 'delete_flow',
    description: 'Delete a flow from Directus by ID. This action cannot be undone.',
    inputSchema: DeleteFlowSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.deleteFlow(args.id),
    successMessage: (args) => `Flow ${args.id} deleted successfully`,
  }),
  createActionTool({
    name: 'delete_flows',
    description: 'Delete multiple flows from Directus at once by their IDs. This action cannot be undone. Example: {ids: ["uuid-1", "uuid-2", "uuid-3"]}',
    inputSchema: DeleteFlowsSchema,
    toolsets: ['flow'],
    handler: async (client, args) => client.deleteFlows(args.ids),
    successMessage: (args) => `${args.ids.length} flows deleted successfully`,
  }),
  createTool({
    name: 'trigger_flow',
    description: 'Trigger a flow with GET or POST webhook trigger. For GET: {id: "flow-uuid", method: "GET"}. For POST: {id: "flow-uuid", method: "POST", data: {key: "value"}}',
    inputSchema: TriggerFlowSchema,
    toolsets: ['flow'],
    handler: async (client, args) => {
      const { id, method = 'GET', data, fields, meta } = args;
      // Query params (fields, meta) apply to both GET and POST
      const queryParams: any = {};
      if (fields) queryParams.fields = fields;
      if (meta) queryParams.meta = meta;
      // Body data only for POST
      const bodyData = method === 'POST' ? data : undefined;
      return client.triggerFlow(method, id, bodyData, Object.keys(queryParams).length > 0 ? queryParams : undefined);
    },
  }),
];

