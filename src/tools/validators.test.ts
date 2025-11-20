import { describe, it, expect } from 'vitest';
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
  MetaSchema,
  QueryParamsSchema,
  FlowTriggerSchema,
  FlowStatusSchema,
  HttpMethodSchema,
  OnDeleteActionSchema,
  OnUpdateActionSchema,
  ExportFormatSchema,
  FlowAccountabilitySchema,
  CollectionMetaSchema,
  CollectionSchemaConfigSchema,
  FieldMetaSchema,
  FieldSchemaConfigSchema,
  RelationMetaSchema,
  RelationSchemaConfigSchema,
  AnyRecordSchema,
  AnyArraySchema,
  ItemIdsArraySchema,
  ItemsArraySchema,
} from './validators.js';

describe('Validators', () => {
  describe('Base schemas', () => {
    describe('CollectionNameSchema', () => {
      it('should accept valid collection names', () => {
        expect(() => CollectionNameSchema.parse('articles')).not.toThrow();
        expect(() => CollectionNameSchema.parse('user_profiles')).not.toThrow();
        expect(() => CollectionNameSchema.parse('test-collection')).not.toThrow();
      });

      it('should reject empty strings', () => {
        expect(() => CollectionNameSchema.parse('')).toThrow();
        expect(() => CollectionNameSchema.parse('   ')).toThrow();
      });

      it('should accept single character names', () => {
        expect(() => CollectionNameSchema.parse('a')).not.toThrow();
      });
    });

    describe('ItemIdSchema', () => {
      it('should accept string IDs', () => {
        expect(() => ItemIdSchema.parse('123')).not.toThrow();
        expect(() => ItemIdSchema.parse('abc-def')).not.toThrow();
      });

      it('should accept number IDs', () => {
        expect(() => ItemIdSchema.parse(123)).not.toThrow();
        expect(() => ItemIdSchema.parse(0)).not.toThrow();
        expect(() => ItemIdSchema.parse(-1)).not.toThrow();
      });

      it('should reject invalid types', () => {
        expect(() => ItemIdSchema.parse(null)).toThrow();
        expect(() => ItemIdSchema.parse(undefined)).toThrow();
        expect(() => ItemIdSchema.parse({})).toThrow();
        expect(() => ItemIdSchema.parse([])).toThrow();
      });
    });

    describe('FieldsSchema', () => {
      it('should accept valid field arrays', () => {
        expect(() => FieldsSchema.parse(['id', 'title'])).not.toThrow();
        expect(() => FieldsSchema.parse(['*'])).not.toThrow();
        expect(() => FieldsSchema.parse([])).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => FieldsSchema.parse(undefined)).not.toThrow();
      });
    });
  });

  describe('Query parameter schemas', () => {
    describe('FilterSchema', () => {
      it('should accept valid filter objects', () => {
        const filter = { status: { _eq: 'published' } };
        expect(() => FilterSchema.parse(filter)).not.toThrow();
      });

      it('should accept complex filters', () => {
        const complexFilter = {
          _and: [
            { status: { _eq: 'published' } },
            { date_created: { _gte: '2024-01-01' } }
          ]
        };
        expect(() => FilterSchema.parse(complexFilter)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => FilterSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('SearchSchema', () => {
      it('should accept valid search strings', () => {
        expect(() => SearchSchema.parse('test query')).not.toThrow();
        expect(() => SearchSchema.parse('')).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => SearchSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('SortSchema', () => {
      it('should accept valid sort arrays', () => {
        expect(() => SortSchema.parse(['title'])).not.toThrow();
        expect(() => SortSchema.parse(['-date_created', 'title'])).not.toThrow();
        expect(() => SortSchema.parse([])).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => SortSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('LimitSchema', () => {
      it('should accept valid limits', () => {
        expect(() => LimitSchema.parse(10)).not.toThrow();
        expect(() => LimitSchema.parse(0)).not.toThrow();
        expect(() => LimitSchema.parse(1000)).not.toThrow();
      });

      it('should reject negative numbers', () => {
        expect(() => LimitSchema.parse(-1)).toThrow();
      });

      it('should be optional', () => {
        expect(() => LimitSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('OffsetSchema', () => {
      it('should accept valid offsets', () => {
        expect(() => OffsetSchema.parse(0)).not.toThrow();
        expect(() => OffsetSchema.parse(100)).not.toThrow();
      });

      it('should reject negative numbers', () => {
        expect(() => OffsetSchema.parse(-1)).toThrow();
      });

      it('should be optional', () => {
        expect(() => OffsetSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('PageSchema', () => {
      it('should accept valid page numbers', () => {
        expect(() => PageSchema.parse(1)).not.toThrow();
        expect(() => PageSchema.parse(100)).not.toThrow();
      });

      it('should reject zero or negative pages', () => {
        expect(() => PageSchema.parse(0)).toThrow();
        expect(() => PageSchema.parse(-1)).toThrow();
      });

      it('should be optional', () => {
        expect(() => PageSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('AggregateSchema', () => {
      it('should accept valid aggregate objects', () => {
        expect(() => AggregateSchema.parse({ count: '*' })).not.toThrow();
        expect(() => AggregateSchema.parse({ avg: 'price', sum: 'total' })).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => AggregateSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('GroupBySchema', () => {
      it('should accept valid groupBy arrays', () => {
        expect(() => GroupBySchema.parse(['category'])).not.toThrow();
        expect(() => GroupBySchema.parse(['category', 'status'])).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => GroupBySchema.parse(undefined)).not.toThrow();
      });
    });

    describe('DeepSchema', () => {
      it('should accept valid deep query objects', () => {
        const deep = { author: { fields: ['name', 'email'] } };
        expect(() => DeepSchema.parse(deep)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => DeepSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('MetaSchema', () => {
      it('should accept valid meta strings', () => {
        expect(() => MetaSchema.parse('filter_count')).not.toThrow();
        expect(() => MetaSchema.parse('*')).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => MetaSchema.parse(undefined)).not.toThrow();
      });
    });
  });

  describe('QueryParamsSchema', () => {
    it('should accept complete query parameter objects', () => {
      const params = {
        fields: ['id', 'title'],
        filter: { status: { _eq: 'published' } },
        search: 'test',
        sort: ['-date_created'],
        limit: 10,
        offset: 0,
        page: 1,
        aggregate: { count: '*' },
        groupBy: ['category'],
        deep: { author: { fields: ['name'] } },
        meta: 'filter_count'
      };
      expect(() => QueryParamsSchema.parse(params)).not.toThrow();
    });

    it('should accept partial query parameter objects', () => {
      const params = {
        fields: ['id'],
        limit: 5
      };
      expect(() => QueryParamsSchema.parse(params)).not.toThrow();
    });

    it('should accept empty objects', () => {
      expect(() => QueryParamsSchema.parse({})).not.toThrow();
    });
  });

  describe('Flow schemas', () => {
    describe('FlowTriggerSchema', () => {
      it('should accept valid trigger types', () => {
        expect(() => FlowTriggerSchema.parse('hook')).not.toThrow();
        expect(() => FlowTriggerSchema.parse('webhook')).not.toThrow();
        expect(() => FlowTriggerSchema.parse('operation')).not.toThrow();
        expect(() => FlowTriggerSchema.parse('schedule')).not.toThrow();
        expect(() => FlowTriggerSchema.parse('manual')).not.toThrow();
      });

      it('should reject invalid trigger types', () => {
        expect(() => FlowTriggerSchema.parse('invalid')).toThrow();
        expect(() => FlowTriggerSchema.parse('')).toThrow();
      });
    });

    describe('FlowStatusSchema', () => {
      it('should accept valid status values', () => {
        expect(() => FlowStatusSchema.parse('active')).not.toThrow();
        expect(() => FlowStatusSchema.parse('inactive')).not.toThrow();
      });

      it('should reject invalid status values', () => {
        expect(() => FlowStatusSchema.parse('pending')).toThrow();
        expect(() => FlowStatusSchema.parse('')).toThrow();
      });
    });

    describe('HttpMethodSchema', () => {
      it('should accept valid HTTP methods', () => {
        expect(() => HttpMethodSchema.parse('GET')).not.toThrow();
        expect(() => HttpMethodSchema.parse('POST')).not.toThrow();
      });

      it('should reject invalid HTTP methods', () => {
        expect(() => HttpMethodSchema.parse('PUT')).toThrow();
        expect(() => HttpMethodSchema.parse('DELETE')).toThrow();
        expect(() => HttpMethodSchema.parse('get')).toThrow();
      });
    });
  });

  describe('Database action schemas', () => {
    describe('OnDeleteActionSchema', () => {
      it('should accept valid delete actions', () => {
        expect(() => OnDeleteActionSchema.parse('CASCADE')).not.toThrow();
        expect(() => OnDeleteActionSchema.parse('SET NULL')).not.toThrow();
        expect(() => OnDeleteActionSchema.parse('RESTRICT')).not.toThrow();
        expect(() => OnDeleteActionSchema.parse('NO ACTION')).not.toThrow();
      });

      it('should reject invalid actions', () => {
        expect(() => OnDeleteActionSchema.parse('DELETE')).toThrow();
        expect(() => OnDeleteActionSchema.parse('cascade')).toThrow();
      });
    });

    describe('OnUpdateActionSchema', () => {
      it('should accept valid update actions', () => {
        expect(() => OnUpdateActionSchema.parse('CASCADE')).not.toThrow();
        expect(() => OnUpdateActionSchema.parse('SET NULL')).not.toThrow();
        expect(() => OnUpdateActionSchema.parse('RESTRICT')).not.toThrow();
        expect(() => OnUpdateActionSchema.parse('NO ACTION')).not.toThrow();
      });

      it('should reject invalid actions', () => {
        expect(() => OnUpdateActionSchema.parse('UPDATE')).toThrow();
        expect(() => OnUpdateActionSchema.parse('cascade')).toThrow();
      });
    });
  });

  describe('ExportFormatSchema', () => {
    it('should accept valid export formats', () => {
      expect(() => ExportFormatSchema.parse('csv')).not.toThrow();
      expect(() => ExportFormatSchema.parse('json')).not.toThrow();
      expect(() => ExportFormatSchema.parse('xml')).not.toThrow();
      expect(() => ExportFormatSchema.parse('yaml')).not.toThrow();
    });

    it('should reject invalid formats', () => {
      expect(() => ExportFormatSchema.parse('pdf')).toThrow();
      expect(() => ExportFormatSchema.parse('')).toThrow();
    });
  });

  describe('FlowAccountabilitySchema', () => {
    it('should accept valid accountability values', () => {
      expect(() => FlowAccountabilitySchema.parse('$public')).not.toThrow();
      expect(() => FlowAccountabilitySchema.parse('$trigger')).not.toThrow();
      expect(() => FlowAccountabilitySchema.parse('$full')).not.toThrow();
      expect(() => FlowAccountabilitySchema.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
    });

    it('should be optional', () => {
      expect(() => FlowAccountabilitySchema.parse(undefined)).not.toThrow();
    });
  });

  describe('Metadata schemas', () => {
    describe('CollectionMetaSchema', () => {
      it('should accept valid collection metadata', () => {
        const meta = {
          icon: 'article',
          note: 'Blog articles',
          singleton: false,
          hidden: false,
          translations: {}
        };
        expect(() => CollectionMetaSchema.parse(meta)).not.toThrow();
      });

      it('should accept partial metadata', () => {
        const meta = { icon: 'test' };
        expect(() => CollectionMetaSchema.parse(meta)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => CollectionMetaSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('CollectionSchemaConfigSchema', () => {
      it('should accept valid schema config', () => {
        const schema = {
          name: 'articles',
          comment: 'Article table'
        };
        expect(() => CollectionSchemaConfigSchema.parse(schema)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => CollectionSchemaConfigSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('FieldMetaSchema', () => {
      it('should accept valid field metadata', () => {
        const meta = {
          interface: 'input',
          required: true,
          readonly: false,
          hidden: false,
          note: 'Title field',
          sort: 1,
          width: 'full'
        };
        expect(() => FieldMetaSchema.parse(meta)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => FieldMetaSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('FieldSchemaConfigSchema', () => {
      it('should accept valid field schema config', () => {
        const schema = {
          default_value: 'Draft',
          max_length: 255,
          is_nullable: false,
          is_unique: false
        };
        expect(() => FieldSchemaConfigSchema.parse(schema)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => FieldSchemaConfigSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('RelationMetaSchema', () => {
      it('should accept valid relation metadata', () => {
        const meta = {
          one_field: 'title',
          sort_field: 'sort',
          one_deselect_action: 'nullify'
        };
        expect(() => RelationMetaSchema.parse(meta)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => RelationMetaSchema.parse(undefined)).not.toThrow();
      });
    });

    describe('RelationSchemaConfigSchema', () => {
      it('should accept valid relation schema config', () => {
        const schema = {
          on_delete: 'CASCADE',
          on_update: 'SET NULL'
        };
        expect(() => RelationSchemaConfigSchema.parse(schema)).not.toThrow();
      });

      it('should be optional', () => {
        expect(() => RelationSchemaConfigSchema.parse(undefined)).not.toThrow();
      });
    });
  });

  describe('Generic schemas', () => {
    describe('AnyRecordSchema', () => {
      it('should accept any record objects', () => {
        expect(() => AnyRecordSchema.parse({ key: 'value' })).not.toThrow();
        expect(() => AnyRecordSchema.parse({})).not.toThrow();
        expect(() => AnyRecordSchema.parse({ nested: { data: true } })).not.toThrow();
      });

      it('should reject non-objects', () => {
        expect(() => AnyRecordSchema.parse('string')).toThrow();
        expect(() => AnyRecordSchema.parse(123)).toThrow();
        expect(() => AnyRecordSchema.parse([])).toThrow();
      });
    });

    describe('AnyArraySchema', () => {
      it('should accept any arrays', () => {
        expect(() => AnyArraySchema.parse([])).not.toThrow();
        expect(() => AnyArraySchema.parse([1, 2, 3])).not.toThrow();
        expect(() => AnyArraySchema.parse(['a', 'b'])).not.toThrow();
        expect(() => AnyArraySchema.parse([{ key: 'value' }])).not.toThrow();
      });

      it('should reject non-arrays', () => {
        expect(() => AnyArraySchema.parse('string')).toThrow();
        expect(() => AnyArraySchema.parse(123)).toThrow();
        expect(() => AnyArraySchema.parse({})).toThrow();
      });
    });

    describe('ItemIdsArraySchema', () => {
      it('should accept arrays of item IDs', () => {
        expect(() => ItemIdsArraySchema.parse([1, 2, 3])).not.toThrow();
        expect(() => ItemIdsArraySchema.parse(['a', 'b'])).not.toThrow();
        expect(() => ItemIdsArraySchema.parse([1, 'abc', 3])).not.toThrow();
      });

      it('should reject arrays with invalid items', () => {
        expect(() => ItemIdsArraySchema.parse([1, null, 3])).toThrow();
        expect(() => ItemIdsArraySchema.parse([1, {}, 3])).toThrow();
      });
    });

    describe('ItemsArraySchema', () => {
      it('should accept arrays of record objects', () => {
        expect(() => ItemsArraySchema.parse([])).not.toThrow();
        expect(() => ItemsArraySchema.parse([{ id: 1, name: 'test' }])).not.toThrow();
        expect(() => ItemsArraySchema.parse([{ id: 1 }, { id: 2 }])).not.toThrow();
      });

      it('should reject arrays with non-objects', () => {
        expect(() => ItemsArraySchema.parse([1, 2, 3])).toThrow();
        expect(() => ItemsArraySchema.parse(['a', 'b'])).toThrow();
      });
    });
  });

  describe('Schema descriptions', () => {
    it('should include helpful descriptions', () => {
      expect(CollectionNameSchema.description).toBe('Collection name');
      expect(ItemIdSchema.description).toBe('Item ID');
      expect(FieldsSchema.description).toBe('Fields to return');
      expect(FilterSchema.description).toBe('Filter object using Directus filter syntax');
      expect(SearchSchema.description).toBe('Search query string');
      expect(LimitSchema.description).toBe('Maximum number of items to return');
    });
  });
});
