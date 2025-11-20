import { z } from 'zod';

// Common base schemas
export const CollectionNameSchema = z.string().trim().min(1).describe('Collection name');
export const ItemIdSchema = z.union([z.string(), z.number()]).describe('Item ID');
export const UuidSchema = z.string().min(1).describe('UUID identifier');

// Common query parameters
export const FieldsSchema = z.array(z.string()).optional().describe('Fields to return');
export const FilterSchema = z.record(z.any()).optional().describe('Filter object using Directus filter syntax');
export const SearchSchema = z.string().optional().describe('Search query string');
export const SortSchema = z.array(z.string()).optional().describe('Sort fields (prefix with - for descending)');
export const LimitSchema = z.number().min(0).optional().describe('Maximum number of items to return');
export const OffsetSchema = z.number().min(0).optional().describe('Number of items to skip');
export const PageSchema = z.number().min(1).optional().describe('Page number (alternative to offset)');
export const AggregateSchema = z.record(z.any()).optional().describe('Aggregation functions');
export const GroupBySchema = z.array(z.string()).optional().describe('Fields to group by');
export const DeepSchema = z.record(z.any()).optional().describe('Deep query for relational data');
export const MetaSchema = z.string().optional().describe('What metadata to return in the response');

// Common query params object
export const QueryParamsSchema = z.object({
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
  meta: MetaSchema,
});

// Flow trigger types
export const FlowTriggerSchema = z.enum(['hook', 'webhook', 'operation', 'schedule', 'manual']).describe('Type of trigger for the flow');

// Flow status
export const FlowStatusSchema = z.enum(['active', 'inactive']).describe('Current status of the flow');

// HTTP methods
export const HttpMethodSchema = z.enum(['GET', 'POST']).describe('HTTP method for triggering the flow');

// Database action enums
export const OnDeleteActionSchema = z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).describe('Action on delete');
export const OnUpdateActionSchema = z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).describe('Action on update');

// Export format enums
export const ExportFormatSchema = z.enum(['csv', 'json', 'xml', 'yaml']).describe('Export format for the snapshot file');

// Flow accountability options
export const FlowAccountabilitySchema = z.string().optional().describe('The permission used during the flow. One of $public, $trigger, $full, or UUID of a role');

// Common metadata objects
export const CollectionMetaSchema = z.object({
  icon: z.string().optional().describe('Icon name for the collection'),
  note: z.string().optional().describe('Description or note about the collection'),
  singleton: z.boolean().optional().describe('Whether this is a singleton collection'),
  hidden: z.boolean().optional().describe('Whether to hide this collection in the app'),
  translations: z.any().optional().describe('Translation configuration'),
}).optional().describe('Collection metadata');

export const CollectionSchemaConfigSchema = z.object({
  name: z.string().optional().describe('Database table name'),
  comment: z.string().optional().describe('Database table comment'),
}).optional().describe('Database schema configuration');

export const FieldMetaSchema = z.object({
  interface: z.string().optional().describe('Interface type (input, select, datetime, etc.)'),
  options: z.any().optional().describe('Interface-specific options'),
  special: z.array(z.string()).optional().describe('Special field types (uuid, date-created, user-created, etc.)'),
  required: z.boolean().optional().describe('Whether field is required'),
  readonly: z.boolean().optional().describe('Whether field is read-only'),
  hidden: z.boolean().optional().describe('Whether field is hidden'),
  note: z.string().optional().describe('Field description or note'),
  sort: z.number().optional().describe('Field sort order'),
  width: z.string().optional().describe('Field width in forms (full, half, etc.)'),
}).optional().describe('Field metadata');

export const FieldSchemaConfigSchema = z.object({
  default_value: z.any().optional().describe('Default value for the field'),
  max_length: z.number().optional().describe('Maximum length for string fields'),
  is_nullable: z.boolean().optional().describe('Whether field can be null'),
  is_unique: z.boolean().optional().describe('Whether field must be unique'),
}).optional().describe('Database schema configuration');

export const RelationMetaSchema = z.object({
  one_field: z.string().optional().describe('Field name in the related collection (for O2M)'),
  sort_field: z.string().optional().describe('Field to use for sorting'),
  one_deselect_action: z.enum(['nullify', 'delete']).optional().describe('Action when deselecting'),
}).optional().describe('Relation metadata');

export const RelationSchemaConfigSchema = z.object({
  on_delete: OnDeleteActionSchema.optional().describe('Action on delete'),
  on_update: OnUpdateActionSchema.optional().describe('Action on update'),
}).optional().describe('Database relation configuration');

// Generic data schemas
export const AnyRecordSchema = z.record(z.any()).describe('Generic key-value object');
export const AnyArraySchema = z.array(z.any()).describe('Generic array');
export const ItemIdsArraySchema = z.array(ItemIdSchema).describe('Array of item IDs');
export const ItemsArraySchema = z.array(AnyRecordSchema).describe('Array of items');
