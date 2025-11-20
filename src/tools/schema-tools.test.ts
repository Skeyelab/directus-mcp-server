import { describe, it, expect, beforeEach, vi } from 'vitest';
import { schemaTools } from './schema-tools.js';
import { DirectusClient } from '../directus-client.js';

describe('Schema Tools', () => {
  let mockClient: {
    [K in keyof DirectusClient]: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      getCollections: vi.fn(),
      getCollection: vi.fn(),
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      getFields: vi.fn(),
      getField: vi.fn(),
      createField: vi.fn(),
      updateField: vi.fn(),
      deleteField: vi.fn(),
      getRelations: vi.fn(),
      getRelation: vi.fn(),
      createRelation: vi.fn(),
      updateRelation: vi.fn(),
      deleteRelation: vi.fn(),
    } as any;
  });

  describe('list_collections', () => {
    it('should list all collections', async () => {
      const mockData = {
        data: [
          { collection: 'articles', meta: { icon: 'article' } },
          { collection: 'users', meta: { icon: 'user' } },
        ],
      };
      mockClient.getCollections.mockResolvedValue(mockData);

      const tool = schemaTools.find((t) => t.name === 'list_collections');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {});
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getCollections).toHaveBeenCalled();
    });
  });

  describe('get_collection', () => {
    it('should get a specific collection', async () => {
      const mockData = {
        collection: 'articles',
        meta: { icon: 'article', note: 'Blog articles' },
        schema: { name: 'articles' },
      };
      mockClient.getCollection.mockResolvedValue(mockData);

      const tool = schemaTools.find((t) => t.name === 'get_collection');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getCollection).toHaveBeenCalledWith('articles');
    });

    it('should validate collection name is required', () => {
      const tool = schemaTools.find((t) => t.name === 'get_collection');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('create_collection', () => {
    it('should create a collection with schema name', async () => {
      const collectionData = {
        collection: 'articles',
        meta: { icon: 'article', note: 'Blog articles' },
      };
      const mockResponse = { ...collectionData, schema: { name: 'articles' } };
      mockClient.createCollection.mockResolvedValue(mockResponse);

      const tool = schemaTools.find((t) => t.name === 'create_collection');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, collectionData);
      expect(mockClient.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'articles',
          schema: { name: 'articles' },
        })
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should preserve existing schema name if provided', async () => {
      const collectionData = {
        collection: 'articles',
        schema: { name: 'custom_table_name' },
      };
      mockClient.createCollection.mockResolvedValue(collectionData);

      const tool = schemaTools.find((t) => t.name === 'create_collection');
      await tool!.handler(mockClient as any, collectionData);

      expect(mockClient.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: { name: 'custom_table_name' },
        })
      );
    });

    it('should validate required fields', () => {
      const tool = schemaTools.find((t) => t.name === 'create_collection');
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });
  });

  describe('update_collection', () => {
    it('should update collection metadata', async () => {
      const updateData = {
        collection: 'articles',
        meta: { icon: 'updated-icon', note: 'Updated note' },
      };
      const mockResponse = { ...updateData };
      mockClient.updateCollection.mockResolvedValue(mockResponse);

      const tool = schemaTools.find((t) => t.name === 'update_collection');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, updateData);
      expect(mockClient.updateCollection).toHaveBeenCalledWith('articles', {
        meta: updateData.meta,
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });
  });

  describe('delete_collection', () => {
    it('should delete a collection', async () => {
      mockClient.deleteCollection.mockResolvedValue({ success: true });

      const tool = schemaTools.find((t) => t.name === 'delete_collection');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
      });
      expect(mockClient.deleteCollection).toHaveBeenCalledWith('articles');
      expect(result.content[0].text).toContain('deleted successfully');
    });
  });

  describe('list_fields', () => {
    it('should list fields for a collection', async () => {
      const mockData = {
        data: [
          { field: 'id', type: 'integer' },
          { field: 'title', type: 'string' },
        ],
      };
      mockClient.getFields.mockResolvedValue(mockData);

      const tool = schemaTools.find((t) => t.name === 'list_fields');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getFields).toHaveBeenCalledWith('articles');
    });
  });

  describe('create_field', () => {
    it('should create a field', async () => {
      const fieldData = {
        collection: 'articles',
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Draft', value: 'draft' },
              { text: 'Published', value: 'published' },
            ],
          },
          required: true,
        },
      };
      const mockResponse = { ...fieldData };
      mockClient.createField.mockResolvedValue(mockResponse);

      const tool = schemaTools.find((t) => t.name === 'create_field');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, fieldData);
      expect(mockClient.createField).toHaveBeenCalledWith('articles', {
        field: 'status',
        type: 'string',
        meta: fieldData.meta,
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should validate required fields', () => {
      const tool = schemaTools.find((t) => t.name === 'create_field');
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).toThrow();
    });
  });

  describe('update_field', () => {
    it('should update a field', async () => {
      const updateData = {
        collection: 'articles',
        field: 'title',
        meta: { required: true, note: 'Article title' },
      };
      const mockResponse = { ...updateData };
      mockClient.updateField.mockResolvedValue(mockResponse);

      const tool = schemaTools.find((t) => t.name === 'update_field');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, updateData);
      expect(mockClient.updateField).toHaveBeenCalledWith(
        'articles',
        'title',
        { meta: updateData.meta }
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });
  });

  describe('delete_field', () => {
    it('should delete a field', async () => {
      mockClient.deleteField.mockResolvedValue({ success: true });

      const tool = schemaTools.find((t) => t.name === 'delete_field');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        field: 'title',
      });
      expect(mockClient.deleteField).toHaveBeenCalledWith('articles', 'title');
      expect(result.content[0].text).toContain('deleted');
    });
  });

  describe('list_relations', () => {
    it('should list all relations', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            collection: 'articles',
            field: 'author',
            related_collection: 'users',
          },
        ],
      };
      mockClient.getRelations.mockResolvedValue(mockData);

      const tool = schemaTools.find((t) => t.name === 'list_relations');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {});
      expect(result.content[0].text).toBe(JSON.stringify(mockData, null, 2));
      expect(mockClient.getRelations).toHaveBeenCalled();
    });
  });

  describe('create_relation', () => {
    it('should create a M2O relation', async () => {
      const relationData = {
        collection: 'articles',
        field: 'author',
        related_collection: 'users',
      };
      const mockResponse = { id: 1, ...relationData };
      mockClient.createRelation.mockResolvedValue(mockResponse);

      const tool = schemaTools.find((t) => t.name === 'create_relation');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, relationData);
      expect(mockClient.createRelation).toHaveBeenCalledWith(relationData);
      expect(result.content[0].text).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it('should create a relation with metadata', async () => {
      const relationData = {
        collection: 'articles',
        field: 'author',
        related_collection: 'users',
        meta: {
          one_deselect_action: 'nullify',
        },
        schema: {
          on_delete: 'CASCADE',
          on_update: 'CASCADE',
        },
      };
      mockClient.createRelation.mockResolvedValue({ id: 1, ...relationData });

      const tool = schemaTools.find((t) => t.name === 'create_relation');
      await tool!.handler(mockClient as any, relationData);

      expect(mockClient.createRelation).toHaveBeenCalledWith(relationData);
    });
  });

  describe('delete_relation', () => {
    it('should delete a relation by finding it first', async () => {
      const relationsData = {
        data: [
          {
            id: 1,
            collection: 'articles',
            field: 'author',
            related_collection: 'users',
          },
        ],
      };
      mockClient.getRelations.mockResolvedValue(relationsData);
      mockClient.deleteRelation.mockResolvedValue({ success: true });

      const tool = schemaTools.find((t) => t.name === 'delete_relation');
      expect(tool).toBeDefined();

      const result = await tool!.handler(mockClient as any, {
        collection: 'articles',
        field: 'author',
      });
      expect(mockClient.getRelations).toHaveBeenCalled();
      expect(mockClient.deleteRelation).toHaveBeenCalledWith(1);
      expect(result.content[0].text).toContain('deleted successfully');
    });

    it('should throw error when relation not found', async () => {
      mockClient.getRelations.mockResolvedValue({ data: [] });

      const tool = schemaTools.find((t) => t.name === 'delete_relation');
      await expect(
        tool!.handler(mockClient as any, {
          collection: 'articles',
          field: 'nonexistent',
        })
      ).rejects.toThrow('Relation not found');
    });

    it('should handle relation with meta.id', async () => {
      const relationsData = {
        data: [
          {
            collection: 'articles',
            field: 'author',
            meta: { id: 5 },
          },
        ],
      };
      mockClient.getRelations.mockResolvedValue(relationsData);
      mockClient.deleteRelation.mockResolvedValue({ success: true });

      const tool = schemaTools.find((t) => t.name === 'delete_relation');
      await tool!.handler(mockClient as any, {
        collection: 'articles',
        field: 'author',
      });

      expect(mockClient.deleteRelation).toHaveBeenCalledWith(5);
    });
  });

  describe('Input Schema Validation', () => {
    it('should validate list_collections requires no arguments', () => {
      const tool = schemaTools.find((t) => t.name === 'list_collections');
      expect(() => {
        tool!.inputSchema.parse({});
      }).not.toThrow();
      // Zod by default allows extra fields (strips them), so this should not throw
      expect(() => {
        tool!.inputSchema.parse({ invalid: 'field' });
      }).not.toThrow();
    });

    it('should validate get_collection requires collection name', () => {
      const tool = schemaTools.find((t) => t.name === 'get_collection');
      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).not.toThrow();
      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });

    it('should validate create_collection schema', () => {
      const tool = schemaTools.find((t) => t.name === 'create_collection');
      const validData = {
        collection: 'articles',
        meta: { icon: 'article' },
      };
      expect(() => {
        tool!.inputSchema.parse(validData);
      }).not.toThrow();

      expect(() => {
        tool!.inputSchema.parse({});
      }).toThrow();
    });

    it('should validate create_field schema', () => {
      const tool = schemaTools.find((t) => t.name === 'create_field');
      const validData = {
        collection: 'articles',
        field: 'title',
        type: 'string',
      };
      expect(() => {
        tool!.inputSchema.parse(validData);
      }).not.toThrow();

      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).toThrow();
    });

    it('should validate create_relation schema', () => {
      const tool = schemaTools.find((t) => t.name === 'create_relation');
      const validData = {
        collection: 'articles',
        field: 'author',
        related_collection: 'users',
      };
      expect(() => {
        tool!.inputSchema.parse(validData);
      }).not.toThrow();

      expect(() => {
        tool!.inputSchema.parse({ collection: 'articles' });
      }).toThrow();
    });
  });
});

