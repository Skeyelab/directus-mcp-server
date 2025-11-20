import { z } from 'zod';
import { createTool, createActionTool } from './tool-helpers.js';
import {
  CollectionNameSchema,
  AnyArraySchema,
  OnDeleteActionSchema,
  OnUpdateActionSchema,
  ExportFormatSchema,
} from './validators.js';

const CreateCollectionSchema = z.object({
  collection: CollectionNameSchema.describe('Collection name (table name)'),
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
  fields: AnyArraySchema.optional().describe('Fields to create with the collection'),
});

const UpdateCollectionSchema = z.object({
  collection: CollectionNameSchema.describe('Collection name to update'),
  meta: z.object({
    icon: z.string().optional(),
    note: z.string().optional(),
    singleton: z.boolean().optional(),
    hidden: z.boolean().optional(),
  }).optional().describe('Metadata to update'),
});

const CreateFieldSchema = z.object({
  collection: CollectionNameSchema,
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
  collection: CollectionNameSchema,
  field: z.string().min(1).describe('Field name to update'),
  type: z.string().optional().describe('Field type'),
  meta: z.any().optional().describe('Field metadata to update'),
  schema: z.any().optional().describe('Database schema to update'),
});

const DeleteFieldSchema = z.object({
  collection: CollectionNameSchema,
  field: z.string().min(1).describe('Field name to delete'),
});

const CreateRelationSchema = z.object({
  collection: CollectionNameSchema.describe('Many collection (the collection with the foreign key)'),
  field: z.string().min(1).describe('Field name in the many collection'),
  related_collection: z.string().optional().describe('One collection (the related collection)'),
  meta: z.object({
    one_field: z.string().optional().describe('Field name in the related collection (for O2M)'),
    sort_field: z.string().optional().describe('Field to use for sorting'),
    one_deselect_action: z.enum(['nullify', 'delete']).optional().describe('Action when deselecting'),
  }).optional().describe('Relation metadata'),
  schema: z.object({
    on_delete: OnDeleteActionSchema.optional(),
    on_update: OnUpdateActionSchema.optional(),
  }).optional().describe('Database relation configuration'),
});

const DeleteRelationSchema = z.object({
  collection: CollectionNameSchema,
  field: z.string().min(1).describe('Field name'),
});

const SchemaSnapshotSchema = z.object({
  version: z.number().optional().describe('Schema version'),
  directus: z.string().optional().describe('Directus version'),
  vendor: z.string().optional().describe('Database vendor'),
  collections: AnyArraySchema.describe('Array of collection definitions'),
  fields: AnyArraySchema.describe('Array of field definitions'),
  relations: AnyArraySchema.describe('Array of relation definitions'),
});

const SchemaDiffSchema = z.object({
  snapshot: SchemaSnapshotSchema.describe('Schema snapshot to compare against'),
  force: z.boolean().optional().describe('Bypass version and database vendor restrictions'),
});

const ApplySchemaDiffSchema = z.object({
  hash: z.string().optional().describe('Hash of the schema snapshot'),
  diff: z.object({
    collections: AnyArraySchema.optional().describe('Collection differences'),
    fields: AnyArraySchema.optional().describe('Field differences'),
    relations: AnyArraySchema.optional().describe('Relation differences'),
  }).describe('Schema difference to apply'),
});

// Tool implementations
export const schemaTools = [
  createTool({
    name: 'list_collections',
    description: 'List all collections in the Directus instance. Returns collection names, metadata, and schema information.',
    inputSchema: z.object({}),
    toolsets: ['default', 'collections'],
    handler: (client, _args) => client.getCollections(),
  }),
  createTool({
    name: 'get_collection',
    description: 'Get detailed information about a specific collection including all fields, metadata, and schema configuration.',
    inputSchema: z.object({
      collection: CollectionNameSchema,
    }),
    toolsets: ['default', 'collections'],
    handler: (client, args) => client.getCollection(args.collection),
  }),
  createTool({
    name: 'create_collection',
    description: 'Create a new collection (database table) in Directus. Automatically creates a proper database table with schema. Can include initial fields. Example: {collection: "articles", meta: {icon: "article", note: "Blog articles"}, fields: [{field: "id", type: "integer", schema: {is_primary_key: true, has_auto_increment: true}}, {field: "title", type: "string"}]}',
    inputSchema: CreateCollectionSchema,
    toolsets: ['default', 'collections'],
    handler: async (client, args) => {
      // Ensure schema is set to create an actual database table (not just a folder)
      if (!args.schema) {
        args.schema = { name: args.collection };
      } else if (!args.schema.name) {
        args.schema.name = args.collection;
      }

      return client.createCollection(args);
    },
  }),
  createTool({
    name: 'update_collection',
    description: 'Update collection metadata such as icon, note, visibility settings, etc.',
    inputSchema: UpdateCollectionSchema,
    toolsets: ['default', 'collections'],
    handler: async (client, args) => {
      const { collection, ...data } = args;
      return client.updateCollection(collection, data);
    },
  }),
  createActionTool({
    name: 'delete_collection',
    description: 'Delete a collection and all its data. This action cannot be undone. Use with caution.',
    inputSchema: z.object({
      collection: CollectionNameSchema,
    }),
    toolsets: ['default', 'collections'],
    handler: async (client, args) => client.deleteCollection(args.collection),
    successMessage: (args) => `Collection "${args.collection}" deleted successfully`,
  }),
  createTool({
    name: 'list_fields',
    description: 'List all fields in a specific collection with their types, metadata, and schema configuration.',
    inputSchema: z.object({
      collection: CollectionNameSchema,
    }),
    toolsets: ['default', 'fields'],
    handler: (client, args) => client.getFields(args.collection),
  }),
  createTool({
    name: 'create_field',
    description: 'Add a new field to a collection. Specify field type, interface, and constraints. Example: {collection: "articles", field: "status", type: "string", meta: {interface: "select-dropdown", options: {choices: [{text: "Draft", value: "draft"}, {text: "Published", value: "published"}]}, required: true}}',
    inputSchema: CreateFieldSchema,
    toolsets: ['default', 'fields'],
    handler: async (client, args) => {
      const { collection, ...fieldData } = args;
      return client.createField(collection, fieldData);
    },
  }),
  createTool({
    name: 'update_field',
    description: 'Update field properties such as metadata, interface options, or schema constraints.',
    inputSchema: UpdateFieldSchema,
    toolsets: ['default', 'fields'],
    handler: async (client, args) => {
      const { collection, field, ...data } = args;
      return client.updateField(collection, field, data);
    },
  }),
  createActionTool({
    name: 'delete_field',
    description: 'Remove a field from a collection. This will delete the column and all its data. Use with caution.',
    inputSchema: DeleteFieldSchema,
    toolsets: ['default', 'fields'],
    handler: async (client, args) => client.deleteField(args.collection, args.field),
    successMessage: (args) => `Field "${args.field}" deleted from collection "${args.collection}"`,
  }),
  createTool({
    name: 'list_relations',
    description: 'List all relations (foreign keys, M2O, O2M, M2M) in the Directus instance.',
    inputSchema: z.object({}),
    toolsets: ['default', 'relations'],
    handler: (client, _args) => client.getRelations(),
  }),
  createTool({
    name: 'get_schema_snapshot',
    description: 'Get a complete schema snapshot of the Directus instance including all collections, fields, and relations. Optionally export to a file format (csv, json, xml, yaml).',
    inputSchema: z.object({
      export: ExportFormatSchema.optional(),
    }),
    toolsets: ['schema'],
    handler: async (client, args) => {
      const params = args.export ? { export: args.export } : undefined;
      return client.getSchemaSnapshot(params);
    },
  }),
  createTool({
    name: 'get_schema_diff',
    description: 'Compare the current instance\'s schema against a schema snapshot and retrieve the difference. This endpoint is only available to admin users. Optionally bypass version and database vendor restrictions with force=true.',
    inputSchema: SchemaDiffSchema,
    toolsets: ['schema'],
    handler: async (client, args) => {
      const { snapshot, force } = args;
      const options = force ? { force: true } : undefined;
      return client.getSchemaDiff(snapshot, options);
    },
  }),
  createTool({
    name: 'apply_schema_diff',
    description: 'Update the instance\'s schema by applying a diff previously retrieved via get_schema_diff. This endpoint is only available to admin users. The diff should include hash and diff object with collections, fields, and relations differences.',
    inputSchema: ApplySchemaDiffSchema,
    toolsets: ['schema'],
    handler: (client, args) => client.applySchemaDiff(args),
  }),
  createTool({
    name: 'create_relation',
    description: 'Create a relation between collections (M2O, O2M, or M2M). For M2O: specify collection, field, and related_collection. For O2M: also include meta.one_field. Example M2O: {collection: "articles", field: "author", related_collection: "users"}',
    inputSchema: CreateRelationSchema,
    toolsets: ['default', 'relations'],
    handler: (client, args) => client.createRelation(args),
  }),
  createActionTool({
    name: 'delete_relation',
    description: 'Delete a relation. Specify the collection and field that contains the relation.',
    inputSchema: DeleteRelationSchema,
    toolsets: ['default', 'relations'],
    handler: async (client, args) => {
      // First get all relations to find the ID
      const relations = await client.getRelations();
      const relation = relations.data?.find(
        (r: any) => r.collection === args.collection && r.field === args.field
      );

      if (!relation) {
        throw new Error(`Relation not found for ${args.collection}.${args.field}`);
      }

      return client.deleteRelation(relation.id || relation.meta?.id);
    },
    successMessage: (args) => `Relation for "${args.collection}.${args.field}" deleted successfully`,
  }),
];

