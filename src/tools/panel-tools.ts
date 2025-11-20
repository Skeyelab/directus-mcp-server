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

// Zod schemas for validation
const ListPanelsSchema = z.object({
  fields: FieldsSchema,
  filter: FilterSchema,
  search: SearchSchema,
  sort: SortSchema,
  limit: LimitSchema,
  offset: OffsetSchema,
  meta: MetaSchema,
});

const GetPanelSchema = z.object({
  id: UuidSchema.describe('Panel ID (UUID)'),
  fields: FieldsSchema,
  meta: MetaSchema,
});

const CreatePanelSchema = z.object({
  dashboard: UuidSchema.describe('Dashboard where this panel is visible (UUID)'),
  name: z.string().min(1).describe('Name of the panel'),
  icon: z.string().optional().describe('Material design icon for the panel'),
  color: z.string().optional().describe('Accent color of the panel'),
  show_header: z.boolean().optional().describe('Whether or not the header should be rendered for this panel'),
  note: z.string().optional().describe('Description for the panel'),
  type: z.string().min(1).describe('The panel type used for this panel (e.g., "time-series", "metric", "label")'),
  position_x: z.number().int().min(0).describe('The X position on the workspace grid'),
  position_y: z.number().int().min(0).describe('The Y position on the workspace grid'),
  width: z.number().int().min(1).describe('Width of the panel in number of workspace dots'),
  height: z.number().int().min(1).describe('Height of the panel in number of workspace dots'),
  options: AnyRecordSchema.optional().describe('Panel-specific options and configuration'),
  user_created: UuidSchema.optional().describe('User that created the panel (UUID)'),
  date_created: z.string().optional().describe('When the panel was created (ISO 8601)'),
});

const CreatePanelsSchema = z.object({
  panels: z.array(CreatePanelSchema).describe('Array of panels to create'),
});

const UpdatePanelSchema = z.object({
  id: UuidSchema.describe('Panel ID (UUID) to update'),
  dashboard: UuidSchema.optional().describe('Dashboard where this panel is visible (UUID)'),
  name: z.string().optional().describe('Name of the panel'),
  icon: z.string().optional().describe('Material design icon for the panel'),
  color: z.string().optional().describe('Accent color of the panel'),
  show_header: z.boolean().optional().describe('Whether or not the header should be rendered for this panel'),
  note: z.string().optional().describe('Description for the panel'),
  type: z.string().optional().describe('The panel type used for this panel'),
  position_x: z.number().int().min(0).optional().describe('The X position on the workspace grid'),
  position_y: z.number().int().min(0).optional().describe('The Y position on the workspace grid'),
  width: z.number().int().min(1).optional().describe('Width of the panel in number of workspace dots'),
  height: z.number().int().min(1).optional().describe('Height of the panel in number of workspace dots'),
  options: AnyRecordSchema.optional().describe('Panel-specific options and configuration'),
});

const UpdatePanelsSchema = z.object({
  panels: z.array(UpdatePanelSchema).describe('Array of panels to update (each must include id)'),
});

const DeletePanelSchema = z.object({
  id: UuidSchema.describe('Panel ID (UUID) to delete'),
});

const DeletePanelsSchema = z.object({
  ids: z.array(z.string()).describe('Array of panel IDs (UUIDs) to delete'),
});

// Tool implementations
export const panelTools = [
  createTool({
    name: 'list_panels',
    description: 'List all panels that exist in Directus. Supports filtering, sorting, pagination, and search. Example: {filter: {"dashboard": {"_eq": "dashboard-uuid"}}, sort: ["position_y", "position_x"], limit: 20}',
    inputSchema: ListPanelsSchema,
    toolsets: ['dashboards'],
    handler: (client, args) => client.listPanels(args),
  }),
  createTool({
    name: 'get_panel',
    description: 'Get a single panel by ID from Directus. Optionally specify fields to return and metadata options.',
    inputSchema: GetPanelSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => {
      const { id, ...params } = args;
      return client.getPanel(id, params);
    },
  }),
  createTool({
    name: 'create_panel',
    description: 'Create a new panel in Directus. Provide the panel data including dashboard, name, type, position, and dimensions. Example: {dashboard: "dashboard-uuid", name: "Sales Chart", type: "time-series", position_x: 0, position_y: 0, width: 6, height: 4}',
    inputSchema: CreatePanelSchema,
    toolsets: ['dashboards'],
    handler: (client, args) => client.createPanel(args),
  }),
  createTool({
    name: 'create_panels',
    description: 'Create multiple panels in Directus at once. More efficient than creating panels one by one. Example: {panels: [{dashboard: "uuid-1", name: "Panel 1", type: "metric", position_x: 0, position_y: 0, width: 3, height: 2}, {dashboard: "uuid-1", name: "Panel 2", type: "chart", position_x: 3, position_y: 0, width: 3, height: 2}]}',
    inputSchema: CreatePanelsSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.createPanels(args.panels),
  }),
  createTool({
    name: 'update_panel',
    description: 'Update an existing panel in Directus. Provide the panel ID and fields to update. Example: {id: "panel-uuid", name: "Updated Panel Name", position_x: 1, position_y: 2, width: 8}',
    inputSchema: UpdatePanelSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => {
      const { id, ...data } = args;
      return client.updatePanel(id, data);
    },
  }),
  createTool({
    name: 'update_panels',
    description: 'Update multiple panels in Directus at once. Each panel must include an id field. Example: {panels: [{id: "uuid-1", position_x: 2, width: 4}, {id: "uuid-2", name: "Updated Name", height: 3}]}',
    inputSchema: UpdatePanelsSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.updatePanels(args.panels),
  }),
  createActionTool({
    name: 'delete_panel',
    description: 'Delete a panel from Directus by ID. This action cannot be undone.',
    inputSchema: DeletePanelSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.deletePanel(args.id),
    successMessage: (args) => `Panel ${args.id} deleted successfully`,
  }),
  createActionTool({
    name: 'delete_panels',
    description: 'Delete multiple panels from Directus at once by their IDs. This action cannot be undone. Example: {ids: ["uuid-1", "uuid-2", "uuid-3"]}',
    inputSchema: DeletePanelsSchema,
    toolsets: ['dashboards'],
    handler: async (client, args) => client.deletePanels(args.ids),
    successMessage: (args) => `${args.ids.length} panels deleted successfully`,
  }),
];
