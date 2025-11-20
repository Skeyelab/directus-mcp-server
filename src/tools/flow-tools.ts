import { z } from 'zod';
import { DirectusClient } from '../directus-client.js';

// Zod schemas for validation
const ListFlowsSchema = z.object({
  fields: z.array(z.string()).optional().describe('Fields to return (e.g., ["id", "name", "status"])'),
  filter: z.record(z.any()).optional().describe('Filter object using Directus filter syntax (e.g., {"status": {"_eq": "active"}})'),
  search: z.string().optional().describe('Search query string'),
  sort: z.array(z.string()).optional().describe('Sort fields (prefix with - for descending, e.g., ["-date_created", "name"])'),
  limit: z.number().optional().describe('Maximum number of flows to return'),
  offset: z.number().optional().describe('Number of flows to skip'),
  meta: z.string().optional().describe('What metadata to return in the response'),
});

const GetFlowSchema = z.object({
  id: z.string().min(1).describe('Flow ID (UUID)'),
  fields: z.array(z.string()).optional().describe('Fields to return'),
  meta: z.string().optional().describe('What metadata to return in the response'),
});

const CreateFlowSchema = z.object({
  name: z.string().min(1).describe('The name of the flow'),
  icon: z.string().optional().describe('Icon displayed in the Admin App for the flow'),
  color: z.string().optional().describe('Color of the icon displayed in the Admin App for the flow'),
  description: z.string().optional().describe('Description of the flow'),
  status: z.enum(['active', 'inactive']).optional().describe('Current status of the flow'),
  trigger: z.enum(['hook', 'webhook', 'operation', 'schedule', 'manual']).describe('Type of trigger for the flow'),
  accountability: z.string().optional().describe('The permission used during the flow. One of $public, $trigger, $full, or UUID of a role'),
  options: z.record(z.any()).optional().describe('Options of the selected trigger for the flow'),
  operation: z.string().optional().describe('UUID of the operation connected to the trigger in the flow'),
});

const CreateFlowsSchema = z.object({
  flows: z.array(CreateFlowSchema).describe('Array of flows to create'),
});

const UpdateFlowSchema = z.object({
  id: z.string().min(1).describe('Flow ID (UUID) to update'),
  name: z.string().optional().describe('The name of the flow'),
  icon: z.string().optional().describe('Icon displayed in the Admin App for the flow'),
  color: z.string().optional().describe('Color of the icon displayed in the Admin App for the flow'),
  description: z.string().optional().describe('Description of the flow'),
  status: z.enum(['active', 'inactive']).optional().describe('Current status of the flow'),
  trigger: z.enum(['hook', 'webhook', 'operation', 'schedule', 'manual']).optional().describe('Type of trigger for the flow'),
  accountability: z.string().optional().describe('The permission used during the flow. One of $public, $trigger, $full, or UUID of a role'),
  options: z.record(z.any()).optional().describe('Options of the selected trigger for the flow'),
  operation: z.string().optional().describe('UUID of the operation connected to the trigger in the flow'),
});

const UpdateFlowsSchema = z.object({
  flows: z.array(UpdateFlowSchema).describe('Array of flows to update (each must include id)'),
});

const DeleteFlowSchema = z.object({
  id: z.string().min(1).describe('Flow ID (UUID) to delete'),
});

const DeleteFlowsSchema = z.object({
  ids: z.array(z.string()).describe('Array of flow IDs (UUIDs) to delete'),
});

const TriggerFlowSchema = z.object({
  id: z.string().min(1).describe('Flow ID (UUID) to trigger'),
  method: z.enum(['GET', 'POST']).optional().default('GET').describe('HTTP method for triggering the flow (GET or POST)'),
  data: z.record(z.any()).optional().describe('Payload for POST request (only used when method is POST)'),
  fields: z.array(z.string()).optional().describe('Fields to return'),
  meta: z.string().optional().describe('What metadata to return in the response'),
});

// Tool implementations
export const flowTools = [
  {
    name: 'list_flows',
    description: 'List all flows that exist in Directus. Supports filtering, sorting, pagination, and search. Example: {filter: {"status": {"_eq": "active"}}, sort: ["-date_created"], limit: 10}',
    inputSchema: ListFlowsSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.listFlows(args);
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
    name: 'get_flow',
    description: 'Get a single flow by ID from Directus. Optionally specify fields to return and metadata options.',
    inputSchema: GetFlowSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { id, ...params } = args;
      const result = await client.getFlow(id, params);
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
    name: 'create_flow',
    description: 'Create a new flow in Directus. Provide the flow data including name, trigger type, and optional configuration. Example: {name: "Update Articles Flow", trigger: "manual", status: "active", accountability: "$trigger"}',
    inputSchema: CreateFlowSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.createFlow(args);
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
    name: 'create_flows',
    description: 'Create multiple flows in Directus at once. More efficient than creating flows one by one. Example: {flows: [{name: "Flow 1", trigger: "manual"}, {name: "Flow 2", trigger: "webhook"}]}',
    inputSchema: CreateFlowsSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.createFlows(args.flows);
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
    name: 'update_flow',
    description: 'Update an existing flow in Directus. Provide the flow ID and fields to update. Example: {id: "flow-uuid", status: "inactive", name: "Updated Flow Name"}',
    inputSchema: UpdateFlowSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { id, ...data } = args;
      const result = await client.updateFlow(id, data);
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
    name: 'update_flows',
    description: 'Update multiple flows in Directus at once. Each flow must include an id field. Example: {flows: [{id: "uuid-1", status: "active"}, {id: "uuid-2", status: "inactive"}]}',
    inputSchema: UpdateFlowsSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.updateFlows(args.flows);
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
    name: 'delete_flow',
    description: 'Delete a flow from Directus by ID. This action cannot be undone.',
    inputSchema: DeleteFlowSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      await client.deleteFlow(args.id);
      return {
        content: [
          {
            type: 'text',
            text: `Flow ${args.id} deleted successfully`,
          },
        ],
      };
    },
  },
  {
    name: 'delete_flows',
    description: 'Delete multiple flows from Directus at once by their IDs. This action cannot be undone. Example: {ids: ["uuid-1", "uuid-2", "uuid-3"]}',
    inputSchema: DeleteFlowsSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      await client.deleteFlows(args.ids);
      return {
        content: [
          {
            type: 'text',
            text: `${args.ids.length} flows deleted successfully`,
          },
        ],
      };
    },
  },
  {
    name: 'trigger_flow',
    description: 'Trigger a flow with GET or POST webhook trigger. For GET: {id: "flow-uuid", method: "GET"}. For POST: {id: "flow-uuid", method: "POST", data: {key: "value"}}',
    inputSchema: TriggerFlowSchema,
    toolsets: ['flow'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { id, method = 'GET', data, fields, meta } = args;
      // Query params (fields, meta) apply to both GET and POST
      const queryParams: any = {};
      if (fields) queryParams.fields = fields;
      if (meta) queryParams.meta = meta;
      // Body data only for POST
      const bodyData = method === 'POST' ? data : undefined;
      const result = await client.triggerFlow(method, id, bodyData, Object.keys(queryParams).length > 0 ? queryParams : undefined);
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
];

