# Directus MCP Server

A Model Context Protocol (MCP) server that provides comprehensive tools for managing Directus schema and content. This server enables AI assistants and other MCP clients to interact with Directus instances programmatically.

## Installation

### From npm (once published)

```bash
npm install -g directus-mcp-server
```

### From source

```bash
git clone https://github.com/yourusername/directus-mcp.git
cd directus-mcp
npm install
npm run build
```

## Features

- **Schema Management**: Create, read, update, and delete collections, fields, and relations
- **Content Management**: Full CRUD operations on items with advanced querying
- **Type Safety**: Built with TypeScript and Zod validation
- **Official SDK**: Uses the official `@directus/sdk` for reliable API interactions
- **Flexible Authentication**: Supports both static tokens and email/password authentication

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with your Directus configuration:

```env
# Directus Instance URL
DIRECTUS_URL=https://your-directus-instance.com

# Authentication - Use either token OR email/password
DIRECTUS_TOKEN=your_static_token_here

# Alternative: Email/Password authentication
# DIRECTUS_EMAIL=admin@example.com
# DIRECTUS_PASSWORD=your_password
```

### Authentication Options

1. **Static Token** (Recommended for production):
   - Generate a static token in Directus Admin App
   - Set `DIRECTUS_TOKEN` environment variable

2. **Email/Password**:
   - Use for development or when static tokens aren't available
   - Set `DIRECTUS_EMAIL` and `DIRECTUS_PASSWORD` environment variables

### Toolset Configuration

The Directus MCP server organizes tools into logical toolsets, similar to GitHub's MCP implementation. This allows you to control which tools are exposed to the MCP client.

**Available Toolsets:**
- `default` - Contains schema and content tools (default behavior when no toolset is specified)
- `schema` - Schema management tools (collections, fields, relations)
- `content` - Content management tools (items CRUD operations)
- `flow` - Flow management tools (workflow automation) - NOT included in default toolset

**Default Behavior:**
When `MCP_TOOLSETS` is not set or empty, only tools in the `default` toolset are exposed. The `default` toolset contains schema and content tools, but **not** flow tools. Flow tools must be explicitly requested by including `flow` in the `MCP_TOOLSETS` environment variable.

**Configuration:**
Set the `MCP_TOOLSETS` environment variable to a comma-separated list of toolsets:

```env
# Expose only schema tools
MCP_TOOLSETS=schema

# Expose schema and content tools
MCP_TOOLSETS=schema,content

# Expose all toolsets (includes flow tools)
MCP_TOOLSETS=default,flow
# OR
MCP_TOOLSETS=schema,content,flow
```

**Examples:**

```json
{
  "mcpServers": {
    "directus-schema": {
      "command": "node",
      "args": ["/path/to/directus-mcp/dist/index.js"],
      "env": {
        "DIRECTUS_URL": "https://your-directus-instance.com",
        "DIRECTUS_TOKEN": "your_token",
        "MCP_TOOLSETS": "schema"
      }
    },
    "directus-content": {
      "command": "node",
      "args": ["/path/to/directus-mcp/dist/index.js"],
      "env": {
        "DIRECTUS_URL": "https://your-directus-instance.com",
        "DIRECTUS_TOKEN": "your_token",
        "MCP_TOOLSETS": "content"
      }
    }
  }
}
```

**Notes:**
- Toolset names are case-insensitive
- Invalid toolset names are ignored (with a warning)
- If all requested toolsets are invalid, the server defaults to the `default` toolset
- Schema and content tools belong to both `default` and their specific toolset
- Flow tools belong ONLY to the `flow` toolset (not in `default`)

## Building

```bash
npm run build
```

## Usage

### Running the Server

```bash
npm start
```

Or use the built binary:

```bash
node dist/index.js
```

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop, Cline):

**Option 1: Using npx (recommended - no installation needed):**
```json
{
  "mcpServers": {
    "directus": {
      "command": "npx",
      "args": ["-y", "directus-mcp-server"],
      "env": {
        "DIRECTUS_URL": "https://your-directus-instance.com",
        "DIRECTUS_TOKEN": "your_static_token_here",
        "MCP_TOOLSETS": "default"
      }
    }
  }
}
```

**Option 2: Using global installation:**
```json
{
  "mcpServers": {
    "directus": {
      "command": "directus-mcp",
      "env": {
        "DIRECTUS_URL": "https://your-directus-instance.com",
        "DIRECTUS_TOKEN": "your_static_token_here",
        "MCP_TOOLSETS": "default"
      }
    }
  }
}
```

**Option 3: Using local source:**
```json
{
  "mcpServers": {
    "directus": {
      "command": "node",
      "args": ["/absolute/path/to/directus-mcp/dist/index.js"],
      "env": {
        "DIRECTUS_URL": "https://your-directus-instance.com",
        "DIRECTUS_TOKEN": "your_static_token_here",
        "MCP_TOOLSETS": "default"
      }
    }
  }
}
```

## Available Tools

### Schema Management Tools

#### `list_collections`
List all collections in the Directus instance.

**Parameters**: None

**Example**:
```json
{}
```

#### `get_collection`
Get detailed information about a specific collection.

**Parameters**:
- `collection` (string): Collection name

**Example**:
```json
{
  "collection": "articles"
}
```

#### `create_collection`
Create a new collection (database table) with optional fields. This automatically creates a proper database table, not just a folder.

**Parameters**:
- `collection` (string): Collection name
- `meta` (object, optional): Collection metadata (icon, note, singleton, etc.)
- `schema` (object, optional): Database schema configuration (automatically set if not provided)
- `fields` (array, optional): Initial fields to create

**Example**:
```json
{
  "collection": "articles",
  "meta": {
    "icon": "article",
    "note": "Blog articles collection"
  },
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": {
        "is_primary_key": true,
        "has_auto_increment": true
      }
    },
    {
      "field": "title",
      "type": "string",
      "meta": {
        "required": true
      }
    },
    {
      "field": "status",
      "type": "string",
      "meta": {
        "interface": "select-dropdown",
        "options": {
          "choices": [
            {"text": "Draft", "value": "draft"},
            {"text": "Published", "value": "published"}
          ]
        }
      }
    }
  ]
}
```

#### `update_collection`
Update collection metadata.

**Parameters**:
- `collection` (string): Collection name
- `meta` (object): Metadata to update

**Example**:
```json
{
  "collection": "articles",
  "meta": {
    "icon": "article",
    "note": "Updated description"
  }
}
```

#### `delete_collection`
Delete a collection and all its data.

**Parameters**:
- `collection` (string): Collection name

**Example**:
```json
{
  "collection": "articles"
}
```

#### `list_fields`
List all fields in a collection.

**Parameters**:
- `collection` (string): Collection name

**Example**:
```json
{
  "collection": "articles"
}
```

#### `create_field`
Add a new field to a collection.

**Parameters**:
- `collection` (string): Collection name
- `field` (string): Field name
- `type` (string): Field type (string, integer, text, boolean, json, uuid, timestamp, etc.)
- `meta` (object, optional): Field metadata
- `schema` (object, optional): Database schema configuration

**Example**:
```json
{
  "collection": "articles",
  "field": "author",
  "type": "uuid",
  "meta": {
    "interface": "select-dropdown-m2o",
    "required": true,
    "special": ["m2o"]
  }
}
```

#### `update_field`
Update field properties.

**Parameters**:
- `collection` (string): Collection name
- `field` (string): Field name
- `type` (string, optional): Field type
- `meta` (object, optional): Metadata to update
- `schema` (object, optional): Schema to update

**Example**:
```json
{
  "collection": "articles",
  "field": "title",
  "meta": {
    "note": "Article title (required)"
  }
}
```

#### `delete_field`
Remove a field from a collection.

**Parameters**:
- `collection` (string): Collection name
- `field` (string): Field name

**Example**:
```json
{
  "collection": "articles",
  "field": "old_field"
}
```

#### `list_relations`
List all relations in the Directus instance.

**Parameters**: None

**Example**:
```json
{}
```

#### `create_relation`
Create a relation between collections.

**Parameters**:
- `collection` (string): Many collection (with foreign key)
- `field` (string): Field name in many collection
- `related_collection` (string, optional): One collection
- `meta` (object, optional): Relation metadata
- `schema` (object, optional): Database relation configuration

**Example (Many-to-One)**:
```json
{
  "collection": "articles",
  "field": "author",
  "related_collection": "users",
  "schema": {
    "on_delete": "SET NULL"
  }
}
```

**Example (One-to-Many)**:
```json
{
  "collection": "articles",
  "field": "author",
  "related_collection": "users",
  "meta": {
    "one_field": "articles"
  }
}
```

#### `delete_relation`
Delete a relation.

**Parameters**:
- `collection` (string): Collection name
- `field` (string): Field name

**Example**:
```json
{
  "collection": "articles",
  "field": "author"
}
```

### Content Management Tools

#### `query_items`
Query items with filtering, sorting, and pagination.

**Parameters**:
- `collection` (string): Collection name
- `fields` (array, optional): Fields to return
- `filter` (object, optional): Filter criteria
- `search` (string, optional): Search query
- `sort` (array, optional): Sort fields (prefix with `-` for descending)
- `limit` (number, optional): Maximum items to return
- `offset` (number, optional): Items to skip
- `page` (number, optional): Page number
- `aggregate` (object, optional): Aggregation functions
- `groupBy` (array, optional): Group by fields
- `deep` (object, optional): Deep relational queries

**Filter Operators**: `_eq`, `_neq`, `_lt`, `_lte`, `_gt`, `_gte`, `_in`, `_nin`, `_null`, `_nnull`, `_contains`, `_ncontains`, `_starts_with`, `_nstarts_with`, `_ends_with`, `_nends_with`, `_between`, `_nbetween`

**Example**:
```json
{
  "collection": "articles",
  "filter": {
    "status": {"_eq": "published"},
    "date_created": {"_gte": "2024-01-01"}
  },
  "sort": ["-date_created"],
  "limit": 10
}
```

#### `get_item`
Get a single item by ID.

**Parameters**:
- `collection` (string): Collection name
- `id` (string|number): Item ID
- `fields` (array, optional): Fields to return
- `deep` (object, optional): Deep relational queries

**Example**:
```json
{
  "collection": "articles",
  "id": 1,
  "fields": ["id", "title", "status", "author.first_name"]
}
```

#### `create_item`
Create a new item.

**Parameters**:
- `collection` (string): Collection name
- `data` (object): Item data

**Example**:
```json
{
  "collection": "articles",
  "data": {
    "title": "My New Article",
    "status": "draft",
    "body": "Article content here...",
    "author": "user-uuid-here"
  }
}
```

#### `update_item`
Update an existing item.

**Parameters**:
- `collection` (string): Collection name
- `id` (string|number): Item ID
- `data` (object): Fields to update

**Example**:
```json
{
  "collection": "articles",
  "id": 1,
  "data": {
    "status": "published"
  }
}
```

#### `delete_item`
Delete an item.

**Parameters**:
- `collection` (string): Collection name
- `id` (string|number): Item ID

**Example**:
```json
{
  "collection": "articles",
  "id": 1
}
```

#### `bulk_create_items`
Create multiple items at once.

**Parameters**:
- `collection` (string): Collection name
- `items` (array): Array of item data objects

**Example**:
```json
{
  "collection": "articles",
  "items": [
    {"title": "Article 1", "status": "draft"},
    {"title": "Article 2", "status": "draft"}
  ]
}
```

#### `bulk_update_items`
Update multiple items at once.

**Parameters**:
- `collection` (string): Collection name
- `items` (array): Array of items with id and fields to update

**Example**:
```json
{
  "collection": "articles",
  "items": [
    {"id": 1, "status": "published"},
    {"id": 2, "status": "published"}
  ]
}
```

#### `bulk_delete_items`
Delete multiple items at once.

**Parameters**:
- `collection` (string): Collection name
- `ids` (array): Array of item IDs

**Example**:
```json
{
  "collection": "articles",
  "ids": [1, 2, 3]
}
```

## Common Use Cases

### Setting up a new content model

1. Create a collection with `create_collection`
2. Add fields with `create_field`
3. Create relations with `create_relation`
4. Start adding content with `create_item`

### Querying content with relations

```json
{
  "collection": "articles",
  "fields": ["*", "author.first_name", "author.last_name"],
  "filter": {"status": {"_eq": "published"}},
  "sort": ["-date_created"],
  "limit": 10
}
```

### Bulk operations

Use `bulk_create_items`, `bulk_update_items`, or `bulk_delete_items` for efficient batch operations.

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build
```

## Error Handling

All tools include error handling and will return descriptive error messages for:
- Authentication failures
- Invalid parameters
- API errors
- Network issues
- Validation errors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

