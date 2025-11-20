import { z } from 'zod';
import { DirectusClient } from '../directus-client.js';

// Zod schemas for validation
const CollectionNameSchema = z.string().min(1).describe('Collection name');

const CreateCollectionSchema = z.object({
  collection: z.string().min(1).describe('Collection name (table name)'),
  meta: z.object({
    icon: z.string().optional().describe('Icon name for the collection'),
    note: z.string().optional().describe('Description or note about the collection'),
    singleton: z.boolean().optional().describe('Whether this is a singleton collection'),
    hidden: z.boolean().optional().describe('Whether to hide this collection in the app'),
    translations: z.any().optional().describe('Translation configuration'),
  }).optional().describe('Collection metadata'),
  schema: z.object({
    name: z.string().optional().describe('Database table name'),
    comment: z.string().optional().describe('Database table comment'),
  }).optional().describe('Database schema configuration'),
  fields: z.array(z.any()).optional().describe('Fields to create with the collection'),
});

const UpdateCollectionSchema = z.object({
  collection: z.string().min(1).describe('Collection name to update'),
  meta: z.object({
    icon: z.string().optional(),
    note: z.string().optional(),
    singleton: z.boolean().optional(),
    hidden: z.boolean().optional(),
  }).optional().describe('Metadata to update'),
});

const CreateFieldSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  field: z.string().min(1).describe('Field name'),
  type: z.string().describe('Field type (string, integer, text, boolean, json, uuid, timestamp, etc.)'),
  meta: z.object({
    interface: z.string().optional().describe('Interface type (input, select, datetime, etc.)'),
    options: z.any().optional().describe('Interface-specific options'),
    special: z.array(z.string()).optional().describe('Special field types (uuid, date-created, user-created, etc.)'),
    required: z.boolean().optional().describe('Whether field is required'),
    readonly: z.boolean().optional().describe('Whether field is read-only'),
    hidden: z.boolean().optional().describe('Whether field is hidden'),
    note: z.string().optional().describe('Field description or note'),
    sort: z.number().optional().describe('Field sort order'),
    width: z.string().optional().describe('Field width in forms (full, half, etc.)'),
  }).optional().describe('Field metadata'),
  schema: z.object({
    default_value: z.any().optional().describe('Default value for the field'),
    max_length: z.number().optional().describe('Maximum length for string fields'),
    is_nullable: z.boolean().optional().describe('Whether field can be null'),
    is_unique: z.boolean().optional().describe('Whether field must be unique'),
  }).optional().describe('Database schema configuration'),
});

const UpdateFieldSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  field: z.string().min(1).describe('Field name to update'),
  type: z.string().optional().describe('Field type'),
  meta: z.any().optional().describe('Field metadata to update'),
  schema: z.any().optional().describe('Database schema to update'),
});

const DeleteFieldSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  field: z.string().min(1).describe('Field name to delete'),
});

const CreateRelationSchema = z.object({
  collection: z.string().min(1).describe('Many collection (the collection with the foreign key)'),
  field: z.string().min(1).describe('Field name in the many collection'),
  related_collection: z.string().optional().describe('One collection (the related collection)'),
  meta: z.object({
    one_field: z.string().optional().describe('Field name in the related collection (for O2M)'),
    sort_field: z.string().optional().describe('Field to use for sorting'),
    one_deselect_action: z.enum(['nullify', 'delete']).optional().describe('Action when deselecting'),
  }).optional().describe('Relation metadata'),
  schema: z.object({
    on_delete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional().describe('Action on delete'),
    on_update: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional().describe('Action on update'),
  }).optional().describe('Database relation configuration'),
});

const DeleteRelationSchema = z.object({
  collection: z.string().min(1).describe('Collection name'),
  field: z.string().min(1).describe('Field name'),
});

const SchemaSnapshotSchema = z.object({
  version: z.number().optional().describe('Schema version'),
  directus: z.string().optional().describe('Directus version'),
  vendor: z.string().optional().describe('Database vendor'),
  collections: z.array(z.any()).describe('Array of collection definitions'),
  fields: z.array(z.any()).describe('Array of field definitions'),
  relations: z.array(z.any()).describe('Array of relation definitions'),
});

const SchemaDiffSchema = z.object({
  snapshot: SchemaSnapshotSchema.describe('Schema snapshot to compare against'),
  force: z.boolean().optional().describe('Bypass version and database vendor restrictions'),
});

const ApplySchemaDiffSchema = z.object({
  hash: z.string().optional().describe('Hash of the schema snapshot'),
  diff: z.object({
    collections: z.array(z.any()).optional().describe('Collection differences'),
    fields: z.array(z.any()).optional().describe('Field differences'),
    relations: z.array(z.any()).optional().describe('Relation differences'),
  }).describe('Schema difference to apply'),
});

// Tool implementations
export const schemaTools = [
  {
    name: 'list_collections',
    description: 'List all collections in the Directus instance. Returns collection names, metadata, and schema information.',
    inputSchema: z.object({}),
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, _args: any) => {
      const result = await client.getCollections();
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
    name: 'get_collection',
    description: 'Get detailed information about a specific collection including all fields, metadata, and schema configuration.',
    inputSchema: z.object({
      collection: CollectionNameSchema,
    }),
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.getCollection(args.collection);
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
    name: 'create_collection',
    description: 'Create a new collection (database table) in Directus. Automatically creates a proper database table with schema. Can include initial fields. Example: {collection: "articles", meta: {icon: "article", note: "Blog articles"}, fields: [{field: "id", type: "integer", schema: {is_primary_key: true, has_auto_increment: true}}, {field: "title", type: "string"}]}',
    inputSchema: CreateCollectionSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      // Ensure schema is set to create an actual database table (not just a folder)
      if (!args.schema) {
        args.schema = { name: args.collection };
      } else if (!args.schema.name) {
        args.schema.name = args.collection;
      }

      const result = await client.createCollection(args);
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
    name: 'update_collection',
    description: 'Update collection metadata such as icon, note, visibility settings, etc.',
    inputSchema: UpdateCollectionSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { collection, ...data } = args;
      const result = await client.updateCollection(collection, data);
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
    name: 'delete_collection',
    description: 'Delete a collection and all its data. This action cannot be undone. Use with caution.',
    inputSchema: z.object({
      collection: CollectionNameSchema,
    }),
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      await client.deleteCollection(args.collection);
      return {
        content: [
          {
            type: 'text',
            text: `Collection "${args.collection}" deleted successfully`,
          },
        ],
      };
    },
  },
  {
    name: 'list_fields',
    description: 'List all fields in a specific collection with their types, metadata, and schema configuration.',
    inputSchema: z.object({
      collection: CollectionNameSchema,
    }),
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.getFields(args.collection);
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
    name: 'create_field',
    description: 'Add a new field to a collection. Specify field type, interface, and constraints. Example: {collection: "articles", field: "status", type: "string", meta: {interface: "select-dropdown", options: {choices: [{text: "Draft", value: "draft"}, {text: "Published", value: "published"}]}, required: true}}',
    inputSchema: CreateFieldSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { collection, ...fieldData } = args;
      const result = await client.createField(collection, fieldData);
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
    name: 'update_field',
    description: 'Update field properties such as metadata, interface options, or schema constraints.',
    inputSchema: UpdateFieldSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { collection, field, ...data } = args;
      const result = await client.updateField(collection, field, data);
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
    name: 'delete_field',
    description: 'Remove a field from a collection. This will delete the column and all its data. Use with caution.',
    inputSchema: DeleteFieldSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      await client.deleteField(args.collection, args.field);
      return {
        content: [
          {
            type: 'text',
            text: `Field "${args.field}" deleted from collection "${args.collection}"`,
          },
        ],
      };
    },
  },
  {
    name: 'list_relations',
    description: 'List all relations (foreign keys, M2O, O2M, M2M) in the Directus instance.',
    inputSchema: z.object({}),
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, _args: any) => {
      const result = await client.getRelations();
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
    name: 'get_schema_snapshot',
    description: 'Get a complete schema snapshot of the Directus instance including all collections, fields, and relations. Optionally export to a file format (csv, json, xml, yaml).',
    inputSchema: z.object({
      export: z.enum(['csv', 'json', 'xml', 'yaml']).optional().describe('Export format for the snapshot file'),
    }),
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const params = args.export ? { export: args.export } : undefined;
      const result = await client.getSchemaSnapshot(params);
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
    name: 'get_schema_diff',
    description: 'Compare the current instance\'s schema against a schema snapshot and retrieve the difference. This endpoint is only available to admin users. Optionally bypass version and database vendor restrictions with force=true.',
    inputSchema: SchemaDiffSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const { snapshot, force } = args;
      const options = force ? { force: true } : undefined;
      const result = await client.getSchemaDiff(snapshot, options);
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
    name: 'apply_schema_diff',
    description: 'Update the instance\'s schema by applying a diff previously retrieved via get_schema_diff. This endpoint is only available to admin users. The diff should include hash and diff object with collections, fields, and relations differences.',
    inputSchema: ApplySchemaDiffSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.applySchemaDiff(args);
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
    name: 'create_relation',
    description: 'Create a relation between collections (M2O, O2M, or M2M). For M2O: specify collection, field, and related_collection. For O2M: also include meta.one_field. Example M2O: {collection: "articles", field: "author", related_collection: "users"}',
    inputSchema: CreateRelationSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      const result = await client.createRelation(args);
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
    name: 'delete_relation',
    description: 'Delete a relation. Specify the collection and field that contains the relation.',
    inputSchema: DeleteRelationSchema,
    toolsets: ['default', 'schema'] as const,
    handler: async (client: DirectusClient, args: any) => {
      // First get all relations to find the ID
      const relations = await client.getRelations();
      const relation = relations.data?.find(
        (r: any) => r.collection === args.collection && r.field === args.field
      );

      if (!relation) {
        throw new Error(`Relation not found for ${args.collection}.${args.field}`);
      }

      await client.deleteRelation(relation.id || relation.meta?.id);
      return {
        content: [
          {
            type: 'text',
            text: `Relation for "${args.collection}.${args.field}" deleted successfully`,
          },
        ],
      };
    },
  },
];

