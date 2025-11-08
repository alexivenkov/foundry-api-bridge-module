# Installation Guide - Foundry API Bridge

## Method 1: Install via Manifest URL (Recommended for users)

### For Users (Installing the module):

1. **Open Foundry VTT**
2. Go to **"Add-on Modules"** tab
3. Click **"Install Module"** button
4. In the **"Manifest URL"** field, paste:
   ```
   https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
   ```
5. Click **"Install"**
6. Enable the module in your world

### For Developers (Publishing the module):

#### Step 1: Update `dist/module.json` with correct URLs

Replace `alexivenkov` with your actual GitHub username:

```json
{
  "id": "foundry-api-bridge",
  "title": "Foundry API Bridge",
  "description": "HTTP REST API bridge for external access to Foundry VTT world data...",
  "version": "3.0.0",
  "authors": [{ "name": "Your Name" }],
  "compatibility": {
    "minimum": "11",
    "verified": "12",
    "maximum": "13"
  },
  "esmodules": ["module.js"],
  "url": "https://github.com/alexivenkov/foundry-api-bridge-module",
  "manifest": "https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json",
  "download": "https://github.com/alexivenkov/foundry-api-bridge-module/archive/refs/heads/main.zip"
}
```

**Important URLs explained:**
- `url` - Your GitHub repository page
- `manifest` - Direct link to module.json (MUST be raw.githubusercontent.com)
- `download` - ZIP archive of your repository

#### Step 2: Create initial release

```bash
# Build the module
npm run build

# Commit and push
git add dist/module.json
git commit -m "Update manifest URLs"
git push origin master
```

#### Step 3: Test the manifest URL

Before sharing, test that the URL works:
```
https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
```

Open this URL in browser - you should see JSON content.

---

## Method 2: Install from GitHub Release (Better for versioning)

### For Developers:

#### Step 1: Create a release package

```bash
# Build the project
npm run build

# Create a release directory
mkdir -p release/foundry-api-bridge
cp -r dist/* release/foundry-api-bridge/
cp config/config.example.json release/foundry-api-bridge/

# Create ZIP
cd release
zip -r foundry-api-bridge-v3.0.0.zip foundry-api-bridge
cd ..
```

#### Step 2: Create GitHub Release

1. Go to your GitHub repo → **Releases** → **"Create a new release"**
2. Tag version: `v3.0.0`
3. Release title: `v3.0.0 - TypeScript Rewrite`
4. Upload `foundry-api-bridge-v3.0.0.zip`
5. Publish release

#### Step 3: Update `dist/module.json` to use release

```json
{
  ...
  "download": "https://github.com/alexivenkov/foundry-api-bridge-module/releases/download/v3.0.0/foundry-api-bridge-v3.0.0.zip"
}
```

### For Users:

Same as Method 1 - use the manifest URL, but now it downloads from releases.

---

## Method 3: Manual Installation (For development/testing)

### Option A: Symlink (Recommended for development)

```bash
# Build the module
cd /path/to/foundry-api-bridge-module
npm run build

# Create symlink to Foundry modules directory
ln -s "$(pwd)/dist" "/path/to/FoundryVTT/Data/modules/foundry-api-bridge"

# Or on Windows (run as Administrator):
mklink /D "C:\path\to\FoundryVTT\Data\modules\foundry-api-bridge" "C:\path\to\foundry-api-bridge-module\dist"
```

### Option B: Copy files

```bash
# Build
npm run build

# Copy to Foundry
cp -r dist /path/to/FoundryVTT/Data/modules/foundry-api-bridge
```

---

## Post-Installation: Configuration

After installation, you MUST configure the module:

### Step 1: Copy example config

```bash
# Navigate to Foundry modules directory
cd /path/to/FoundryVTT/Data/modules/foundry-api-bridge

# Copy example config
cp config.example.json config.json
```

Or manually create `config.json` in the module directory:

```json
{
  "$schema": "./config.schema.json",
  "apiServer": {
    "url": "http://localhost:3001",
    "updateInterval": 5000,
    "endpoints": {
      "worldData": "/update",
      "compendium": "/update-compendium"
    }
  },
  "features": {
    "autoLoadCompendium": true,
    "collectWorldData": true,
    "periodicUpdates": true
  },
  "compendium": {
    "autoLoad": [
      "dnd5e.monsters",
      "dnd5e.spells"
    ]
  },
  "logging": {
    "enabled": true,
    "level": "info"
  }
}
```

### Step 2: Start your API server

Make sure your API server is running on `http://localhost:3001` (or whatever URL you configured).

### Step 3: Enable module in Foundry

1. Launch Foundry VTT
2. Open your world
3. Go to **Game Settings** → **Manage Modules**
4. Enable **"Foundry API Bridge"**
5. Click **"Save Module Settings"**
6. Reload the world

### Step 4: Verify it's working

Open browser console (F12) and check for:
```
Foundry API Bridge | Loading module v3.0.0...
Foundry API Bridge | Module initializing...
Foundry API Bridge | Module initialized successfully
Foundry API Bridge | Update loop started (interval: 5000ms)
Foundry API Bridge | Auto-loading 2 compendia...
```

---

## Troubleshooting

### "Module not found" error
- Check manifest URL is correct and accessible
- Verify `module.json` has correct `id` field
- Clear Foundry's cache and retry

### "Failed to load config"
- Create `config.json` in module directory
- Copy from `config.example.json`
- Check JSON syntax is valid

### "Update loop not starting"
- Check `features.periodicUpdates` is `true` in config
- Verify API server URL is correct
- Check browser console for errors

### "Compendium auto-load fails"
- Verify compendium IDs in config match installed packs
- Use console: `game.packs.map(p => p.collection)` to list available packs
- Check pack IDs are correct (e.g., `"dnd5e.monsters"`)

---

## Advanced: Using GitHub Actions for Auto-Release

Create `.github/workflows/release.yml`:

```yaml
name: Release Module

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Create release package
        run: |
          mkdir -p release/foundry-api-bridge
          cp -r dist/* release/foundry-api-bridge/
          cp config/config.example.json release/foundry-api-bridge/
          cd release
          zip -r foundry-api-bridge-${{ github.ref_name }}.zip foundry-api-bridge

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: release/foundry-api-bridge-${{ github.ref_name }}.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Then to release:
```bash
git tag v3.0.0
git push origin v3.0.0
```

GitHub Actions will automatically build and create a release!

---

## Testing the Installation

### Manual test in Foundry Console:

```javascript
// Check module is loaded
window.FoundryAPIBridge

// Collect world data
const data = FoundryAPIBridge.collectWorldData()
console.log(data)

// List available compendia
const packs = FoundryAPIBridge.collectCompendiumMetadata()
console.log(packs)

// Manually load a pack
await FoundryAPIBridge.loadAndSendCompendium('dnd5e.monsters')
```

---

## Summary of URLs needed:

1. **Manifest URL** (for users to install):
   ```
   https://raw.githubusercontent.com/alexivenkov/foundry-api-bridge-module/master/dist/module.json
   ```

2. **Repository URL** (in module.json):
   ```
   https://github.com/alexivenkov/foundry-api-bridge-module
   ```

3. **Download URL** (in module.json):
   ```
   https://github.com/alexivenkov/foundry-api-bridge-module/releases/download/v3.0.0/foundry-api-bridge-v3.0.0.zip
   ```
   or
   ```
   https://github.com/alexivenkov/foundry-api-bridge-module/archive/refs/heads/main.zip
   ```
