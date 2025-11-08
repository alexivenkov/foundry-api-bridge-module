# Publishing Guide

This guide explains how to publish the module to GitHub and create releases.

## Initial Setup (One Time)

### 1. Initialize Git Repository

```bash
cd /Users/aleksandr.ivenkov/www/foundry-api-bridge-module

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Foundry API Bridge v3.0.0

- Complete TypeScript rewrite
- UI-based configuration
- 77 unit tests
- Strict type checking
- Modern build system with Vite"
```

### 2. Create GitHub Repository

1. Go to https://github.com/alexivenkov
2. Click **"New repository"**
3. Name: `foundry-api-bridge`
4. Description: `HTTP REST API bridge for external access to Foundry VTT world data`
5. **Public** repository
6. **Do NOT** initialize with README (we already have one)
7. Click **"Create repository"**

### 3. Push to GitHub

```bash
# Add remote
git remote add origin git@github.com:alexivenkov/foundry-api-bridge-module.git

# Push to master branch
git branch -M master
git push -u origin master
```

## Creating a Release

### Method 1: Using GitHub Actions (Recommended)

1. **Create and push a version tag:**
   ```bash
   # Make sure all changes are committed
   git add .
   git commit -m "Release v3.0.0"

   # Create version tag
   git tag v3.0.0

   # Push tag to GitHub
   git push origin v3.0.0
   ```

2. **GitHub Actions will automatically:**
   - Run tests
   - Build the module
   - Create a ZIP file
   - Create a GitHub Release
   - Attach the ZIP to the release

3. **Check the release:**
   - Go to https://github.com/alexivenkov/foundry-api-bridge-module/releases
   - You should see `Release v3.0.0` with `foundry-api-bridge.zip` attached

### Method 2: Manual Release (Alternative)

If you prefer to create releases manually:

1. **Build the module:**
   ```bash
   npm run build
   ```

2. **Create ZIP:**
   ```bash
   cd dist
   zip -r ../foundry-api-bridge-v3.0.0.zip .
   cd ..
   ```

3. **Create GitHub Release:**
   - Go to https://github.com/alexivenkov/foundry-api-bridge-module/releases
   - Click **"Create a new release"**
   - Tag: `v3.0.0`
   - Title: `Release v3.0.0`
   - Description: Copy from CHANGELOG.md
   - Upload `foundry-api-bridge-v3.0.0.zip`
   - Click **"Publish release"**

## Testing the Installation

After publishing, test that the module can be installed via manifest URL:

1. **In Foundry VTT:**
   - Go to **Add-on Modules**
   - Click **Install Module**
   - Paste: `https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json`
   - Click **Install**

2. **Verify:**
   - Module should appear in the list
   - Enable it in your world
   - Check that configuration UI works

## Updating for Future Releases

### 1. Update Version

Update version in **package.json**:
```json
{
  "version": "3.1.0"
}
```

Update version in **dist/module.json**:
```json
{
  "version": "3.1.0"
}
```

### 2. Update CHANGELOG.md

Add new version section:
```markdown
## [3.1.0] - 2024-11-XX

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix Z
```

### 3. Commit and Tag

```bash
git add .
git commit -m "Release v3.1.0"
git tag v3.1.0
git push origin master
git push origin v3.1.0
```

### 4. GitHub Actions

GitHub Actions will automatically create the release.

## Important Files

These files **MUST** be in git repository:

- ✅ `dist/module.json` - Required for manifest URL
- ✅ `dist/config.json` - Default configuration
- ✅ `dist/config.schema.json` - JSON Schema
- ✅ `dist/templates/` - HTML templates
- ✅ `dist/styles/` - CSS files

These files are **IGNORED** (generated during build):

- ❌ `dist/module.js`
- ❌ `dist/module.js.map`
- ❌ `node_modules/`

## Troubleshooting

### "Module not found" in Foundry

- Check that `dist/module.json` is pushed to GitHub
- Verify manifest URL is correct
- Clear Foundry's cache and retry

### GitHub Actions fails

- Check workflow logs at https://github.com/alexivenkov/foundry-api-bridge-module/actions
- Ensure tests pass: `npm test`
- Ensure build works: `npm run build`

### Release ZIP is wrong

- Check that `dist/` contains all required files before creating tag
- Ensure `.gitignore` is correct
- Run `npm run build` before tagging
