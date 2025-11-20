# GitHub Copilot Instructions

## Project Overview

This is a Model Context Protocol (MCP) server that provides comprehensive tools for managing Directus schema and content. It enables AI assistants and other MCP clients to interact with Directus instances programmatically.

**Key Technologies:**
- TypeScript (ES2022, Node16 modules)
- Model Context Protocol SDK (`@modelcontextprotocol/sdk`)
- Directus SDK (`@directus/sdk`)
- Zod for runtime validation
- Vitest for testing
- ESLint for linting

## Project Structure

```
src/
├── index.ts                    # Main MCP server entry point
├── directus-client.ts          # Directus API client with auth
├── directus-client.test.ts     # Client tests
├── tools/                      # MCP tool implementations
│   ├── schema-tools.ts         # Collection, field, relation management
│   ├── schema-tools.test.ts
│   ├── content-tools.ts        # CRUD operations for items
│   ├── content-tools.test.ts
│   ├── flow-tools.ts           # Directus flow management
│   └── flow-tools.test.ts
└── types/                      # TypeScript type definitions
    └── index.ts
```

## Development Workflow

### Building
```bash
npm run build          # Compile TypeScript to dist/
npm run dev           # Watch mode for development
```

### Testing
```bash
npm test              # Run all tests with Vitest
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Linting
```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

## Code Style and Conventions

### TypeScript
- Use ES2022 features with Node16 module resolution
- Strict mode is enabled - leverage full type safety
- Use explicit return types for exported functions
- Avoid `any` types (allowed in tests only)
- Use `interface` for public API types, `type` for unions/intersections

### Module System
- Use ES modules (`.js` extensions in imports)
- Import types explicitly when needed
- Use named exports, avoid default exports

### Error Handling
- Wrap tool executions in try-catch blocks
- Return descriptive error messages in tool responses
- Log errors to stderr (console.error)
- Use appropriate HTTP status codes from Directus SDK

### Tool Pattern
Each MCP tool follows this structure:
```typescript
{
  name: 'tool_name',
  description: 'Clear description of what the tool does',
  inputSchema: zodSchema.shape,  // Zod schema converted to JSON schema
  handler: async (args) => {
    // Validate input
    const validated = zodSchema.parse(args);
    
    // Execute operation
    const result = await directusClient.request(operation);
    
    // Return formatted response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
}
```

## Testing Practices

### Test Structure
- Use `describe` blocks to group related tests
- Use `it` or `test` for individual test cases
- Mock Directus client methods with vi.fn()
- Test both success and error paths
- Verify tool schema validation

### Test Organization
```typescript
describe('tool_name', () => {
  describe('input schema', () => {
    // Schema validation tests
  });

  describe('handler', () => {
    beforeEach(() => {
      // Setup mocks
    });

    it('should handle success case', async () => {
      // Test implementation
    });

    it('should handle errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

### Mocking
```typescript
const mockRequest = vi.fn();
const mockClient = { request: mockRequest } as any;
```

## Key Dependencies

### @modelcontextprotocol/sdk
- Provides Server, StdioServerTransport classes
- Request schemas for tool listing and execution
- Follow MCP protocol specification

### @directus/sdk
- Use for all Directus API interactions
- Leverage typed operations (readItems, createItem, etc.)
- Handle authentication (static token or email/password)
- Use query builders for filtering, sorting, pagination

### Zod
- Define input schemas for all tools
- Use `.shape` to convert to MCP JSON schema format
- Leverage `.parse()` for runtime validation
- Create reusable schema components

## Authentication

The server supports two authentication methods:
1. **Static Token**: `DIRECTUS_TOKEN` env var (recommended)
2. **Email/Password**: `DIRECTUS_EMAIL` and `DIRECTUS_PASSWORD` env vars

Validate that at least one method is configured at startup.

## Common Patterns

### Adding a New Tool
1. Define input schema with Zod in the appropriate tools file
2. Create tool definition with name, description, inputSchema
3. Implement handler with proper error handling
4. Export tool in tools array
5. Add comprehensive tests in corresponding `.test.ts` file
6. Update README.md with tool documentation

### Query Building
Use Directus SDK query builders:
```typescript
readItems(collection, {
  fields: ['*'],
  filter: { status: { _eq: 'published' } },
  sort: ['-date_created'],
  limit: 10,
})
```

### Schema Operations
- Use `createCollection`, `updateCollection`, `deleteCollection`
- Use `createField`, `updateField`, `deleteField`
- Use `createRelation`, `deleteRelation`
- Always validate collection/field names

## Environment Variables

Required:
- `DIRECTUS_URL`: Base URL of Directus instance

One of:
- `DIRECTUS_TOKEN`: Static authentication token
- `DIRECTUS_EMAIL` + `DIRECTUS_PASSWORD`: Email/password authentication

## Best Practices

1. **Type Safety**: Leverage TypeScript's type system fully
2. **Validation**: Always validate input with Zod schemas
3. **Error Messages**: Provide clear, actionable error messages
4. **Testing**: Write tests for all new tools and functions
5. **Documentation**: Update README.md when adding features
6. **Consistency**: Follow existing patterns in the codebase
7. **Async/Await**: Use async/await, avoid callbacks
8. **Imports**: Use `.js` extensions for local imports (ES modules)

## Common Issues

### Module Resolution
- Always include `.js` extension in local imports
- Use `import type` for type-only imports

### Directus API
- Check Directus documentation for field types and options
- Test schema operations in a development Directus instance
- Be aware of cascade delete behaviors with relations

### MCP Protocol
- Tool responses must follow MCP content format
- Use `text` content type for JSON responses
- Handle tool not found errors gracefully

## Publishing

Follow the automated publishing workflow in `PUBLISHING.md`:
1. Update version with `npm version patch|minor|major`
2. Push commits and tags: `git push && git push --tags`
3. GitHub Actions handles the rest (lint, test, build, publish)

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
- [Zod Documentation](https://zod.dev/)
