# Compendium Auto-Load Setup Guide

## Quick Setup (v3.0.0+)

Starting from version 3.0.0, you can select compendia directly from the UI!

### Step 1: Open Module Settings

1. Launch Foundry VTT and open your world as GM
2. Go to **Game Settings → Configure Settings**
3. Find **Foundry API Bridge** in Module Settings
4. Click **Configure** button

### Step 2: Select Compendia

In the configuration form, you'll see a new section **"Compendia Auto-Load"**:

![Compendia Selection](docs/compendia-selection.png)

- All available compendium packs are listed with checkboxes
- Each item shows:
  - **Name** - Human-readable compendium name
  - **ID** - Technical identifier (e.g., `dnd5e.monsters`)
  - **Type** - Document type (Actor, Item, JournalEntry, etc.)

### Step 3: Configure and Save

1. ✅ Check the compendia you want to load automatically
2. ✅ Ensure **"Auto-load Compendium on Ready"** is enabled
3. Click **Save Configuration**

The module will **immediately start loading** the selected compendia and send them to your API server!

### Step 4: Verify

Check the browser console (F12) for messages like:

```
Foundry API Bridge | Configuration saved successfully
Foundry API Bridge | Triggering compendium auto-load...
Auto-loading 3 compendia...
Loading compendium: dnd5e.monsters (425 documents)...
✓ Compendium dnd5e.monsters loaded and sent successfully
...
Successfully loaded 3 compendium pack(s)
```

## What Happens When You Save?

1. **Settings are saved** - Your selection is stored in Foundry's world settings
2. **Immediate load** - If "Auto-load Compendium on Ready" is enabled, the module immediately loads all selected compendia
3. **Data sent to API** - Each compendium is sent to your API server at the configured endpoint
4. **Notification** - You'll see a success/error notification in Foundry

## Common Compendium IDs

### D&D 5e (SRD)
- `dnd5e.monsters` - D&D 5e Monsters (425 creatures)
- `dnd5e.spells` - D&D 5e Spells (319 spells)
- `dnd5e.items` - D&D 5e Items (weapons, armor, etc.)
- `dnd5e.classes` - D&D 5e Classes
- `dnd5e.races` - D&D 5e Races

### Other Systems
The list will show all compendia from:
- **Core Foundry** - Default content
- **Game System** - Your installed system (D&D 5e, PF2e, etc.)
- **Modules** - Any module that provides compendia

## Tips

### 🚀 Performance
- Loading large compendia (like monsters) can take 10-30 seconds
- You'll see progress in the console
- The UI will be responsive during loading

### 🔄 Re-loading
To reload compendia after changes:
1. Open module settings
2. Click **Save Configuration** again
   - OR -
3. Use console: `await FoundryAPIBridge.autoLoadCompendium()`

### 🎯 Selective Loading
Don't load everything! Only select compendia you actually need:
- For AI DM: Monsters, Spells, Items
- For Analytics: Actors, Scenes
- For Backups: Everything

### ⚠️ Troubleshooting

**"No compendia available"**
- Install a game system (like D&D 5e)
- Install compendium modules
- Refresh the settings form

**"Failed to load compendia"**
- Check API server is running
- Check server URL in settings
- Look at browser console for errors

**"Compendia not showing on server"**
- Verify server endpoint: `POST /update-compendium`
- Check server logs
- Test manually: `await FoundryAPIBridge.loadAndSendCompendium('dnd5e.monsters')`

## Advanced: Manual Console Commands

You can still use console commands for advanced operations:

```javascript
// List all available compendia
game.packs.map(p => ({
  id: p.collection,
  label: p.metadata.label,
  count: p.index.size
}))

// Get current config
game.settings.get('foundry-api-bridge', 'config').compendium.autoLoad

// Manually set compendia (advanced)
const config = game.settings.get('foundry-api-bridge', 'config');
config.compendium.autoLoad = ['dnd5e.monsters', 'dnd5e.spells'];
await game.settings.set('foundry-api-bridge', 'config', config);

// Trigger manual reload
await FoundryAPIBridge.autoLoadCompendium()

// Load single compendium
await FoundryAPIBridge.loadAndSendCompendium('dnd5e.monsters')
```

## API Server Integration

Your server receives compendia at `POST /update-compendium`:

```json
{
  "packId": "dnd5e.monsters",
  "data": {
    "id": "dnd5e.monsters",
    "label": "D&D 5e Monsters",
    "type": "Actor",
    "system": "dnd5e",
    "documentCount": 425,
    "documents": [
      {
        "id": "abc123",
        "uuid": "Compendium.dnd5e.monsters.abc123",
        "name": "Adult Red Dragon",
        "type": "npc",
        "img": "systems/dnd5e/icons/creatures/dragon-red.webp",
        "system": {
          // ... full D&D 5e actor data
        }
      }
      // ... more documents
    ]
  }
}
```

## Migration from Old Versions

If you were using console commands before:

**Old way (v2.x):**
```javascript
const config = game.settings.get('foundry-api-bridge', 'config');
config.compendium.autoLoad = ['dnd5e.monsters'];
await game.settings.set('foundry-api-bridge', 'config', config);
```

**New way (v3.0.0+):**
Just use the UI! Open settings, check the boxes, save. Done! 🎉

---

**Need help?** Open an issue on [GitHub](https://github.com/alexivenkov/foundry-api-bridge-module/issues)
