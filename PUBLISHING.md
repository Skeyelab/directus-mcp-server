# Publishing Guide

## Automated Publishing (Recommended)

This project uses GitHub Actions to automatically publish to NPM when version tags are pushed. This ensures all releases go through the same quality checks (lint, test, build) before publishing.

### Setup (One-time)

1. **Create NPM Access Token**:
   - Go to [npmjs.com](https://www.npmjs.com) and log in
   - Navigate to Access Tokens: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Automation" (or "Classic" with "Publish" scope)
   - Copy the token (you won't see it again)

2. **Add NPM_TOKEN to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM access token
   - Click "Add secret"

### Publishing a New Version

Once setup is complete, publishing is simple:

```bash
# 1. Update version (patch, minor, or major)
npm version patch   # for bug fixes (1.0.0 → 1.0.1)
npm version minor   # for new features (1.0.0 → 1.1.0)
npm version major   # for breaking changes (1.0.0 → 2.0.0)

# 2. Push the commit and tag
git push && git push --tags
```

That's it! The GitHub Actions workflow will:
- Run linting and tests
- Build the project
- Verify the version matches the tag
- Publish to NPM
- Create a GitHub release

The workflow triggers automatically when you push a tag matching `v*` (e.g., `v1.0.2`).

## Manual Publishing (Fallback)

If you need to publish manually or the automated workflow isn't working:

### 1. Prepare the Package

Before publishing, update these fields in `package.json`:

- `author`: Your name and email
- `repository.url`: Your GitHub repository URL
- `homepage`: Your project homepage URL
- `bugs.url`: Your GitHub issues URL

### 2. Create a LICENSE File

```bash
# MIT License is already specified, create the LICENSE file
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

### 3. Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial release of Directus MCP server"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/directus-mcp.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4. Publish to npm

```bash
# Login to npm (you need an npm account)
npm login

# Build the project
npm run build

# Publish to npm
npm publish

# Or if the name is taken, publish with a scope
npm publish --access public
```

### 5. Create a GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `v1.0.0 - Initial Release`
5. Description: Copy from README.md features section
6. Publish release

### 6. Register with MCP Community

Add your server to the MCP servers list:

1. **Smithery.ai**: Submit your server to [smithery.ai](https://smithery.ai) (MCP server registry)
2. **Awesome MCP Servers**: Create a PR to add your server to community lists
3. **Anthropic MCP Documentation**: Consider submitting to official examples

### 7. Update Package Name (if needed)

If `directus-mcp-server` is taken on npm, consider these alternatives:

- `@yourusername/directus-mcp-server` (scoped package)
- `mcp-directus-server`
- `directus-mcp`
- `mcp-server-directus`

Check availability:
```bash
npm search directus-mcp
```

### 8. After Publishing

Users can install with:

```bash
# Global installation
npm install -g directus-mcp-server

# Or with npx (no installation needed)
npx directus-mcp-server
```

### 9. Update MCP Client Configs

After publishing, users add to their MCP config:

**For npm global install:**
```json
{
  "mcpServers": {
    "directus": {
      "command": "directus-mcp",
      "env": {
        "DIRECTUS_URL": "https://your-instance.directus.app",
        "DIRECTUS_TOKEN": "your_token"
      }
    }
  }
}
```

**For npx:**
```json
{
  "mcpServers": {
    "directus": {
      "command": "npx",
      "args": ["-y", "directus-mcp-server"],
      "env": {
        "DIRECTUS_URL": "https://your-instance.directus.app",
        "DIRECTUS_TOKEN": "your_token"
      }
    }
  }
}
```

### 10. Announce Your Server

- Post on X/Twitter with #MCP #Directus hashtags
- Share in Directus Discord community
- Post on Reddit r/Directus
- Write a blog post or tutorial
- Add to your portfolio

## Version Management

The automated workflow handles publishing, but you still manage version bumps manually:

```bash
# Patch release (1.0.0 → 1.0.1) - bug fixes
npm version patch

# Minor release (1.0.0 → 1.1.0) - new features
npm version minor

# Major release (1.0.0 → 2.0.0) - breaking changes
npm version major

# This automatically:
# - Updates package.json version
# - Creates a git commit
# - Creates a git tag (e.g., v1.0.1)

# Push changes and tags to trigger automated publish
git push && git push --tags
```

**Note**: The `npm version` command will also run the `prepublishOnly` script, which ensures the project is built before creating the tag.

## Package Quality Checklist

Before publishing, ensure:

- ✅ README is comprehensive with examples
- ✅ All TypeScript compiles without errors
- ✅ .gitignore excludes node_modules, dist, .env
- ✅ LICENSE file exists
- ✅ package.json has correct metadata
- ✅ Repository is public on GitHub
- ✅ Tests work (if applicable)
- ✅ Documentation is clear
- ✅ Examples are included

## npm Badge

After publishing, add this badge to README.md:

```markdown
[![npm version](https://badge.fury.io/js/directus-mcp-server.svg)](https://www.npmjs.com/package/directus-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/directus-mcp-server.svg)](https://www.npmjs.com/package/directus-mcp-server)
```

## Maintenance

- Respond to issues on GitHub
- Keep dependencies updated
- Follow semver for version numbers
- Maintain backwards compatibility when possible
- Document breaking changes in releases

