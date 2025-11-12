# Release Notes - v3.1.0

## 🎉 Major Feature: UI-Based Compendium Selection

This release adds the most requested feature - **visual compendium selection directly in the settings UI**!

### What's New

#### ✨ Compendium Selection UI
- **Visual list** of all available compendia with checkboxes
- Shows compendium **name, ID, and type** for easy identification
- **Check/uncheck** compendia you want to auto-load
- **Instant loading** when you save settings
- **Success/error notifications** so you know what happened

#### 🎨 Enhanced User Experience
- Scrollable list with custom styling
- Hover effects for better usability
- Clean, organized interface
- Matches Foundry VTT's design language

### Before vs After

**Before (v3.0.0):**
```javascript
// Had to use console commands
const config = game.settings.get('foundry-api-bridge', 'config');
config.compendium.autoLoad = ['dnd5e.monsters', 'dnd5e.spells'];
await game.settings.set('foundry-api-bridge', 'config', config);
```

**After (v3.1.0):**
1. Open settings
2. Check the compendia you want
3. Click Save
4. Done! ✅

### How to Use

1. **Open Module Settings**
   - Game Settings → Configure Settings → Foundry API Bridge → Configure

2. **Select Compendia**
   - Scroll through the "Compendia Auto-Load" section
   - Check the compendia you want to load
   - Each shows: Name, ID (e.g., `dnd5e.monsters`), Type (Actor/Item/etc.)

3. **Save & Load**
   - Click "Save Configuration"
   - Module immediately loads selected compendia
   - You'll see a notification with results

4. **Verify**
   - Check browser console for loading progress
   - Check your API server for received data

### Technical Details

#### Files Changed
- `src/ui/ApiConfigForm.ts` - Added compendium list logic and auto-load trigger
- `dist/templates/config-form.html` - Added compendium selection section
- `dist/styles/config-form.css` - Added styling for compendium list
- Version bumped to 3.1.0 across all files

#### What Happens When You Save
1. ✅ Settings are validated and saved
2. ✅ If "Auto-load Compendium on Ready" is enabled
3. ✅ Module calls `FoundryAPIBridge.autoLoadCompendium()`
4. ✅ Each selected compendium is loaded and sent to API
5. ✅ Success/error notification is displayed

### Example Use Cases

**AI DM Setup:**
- ☑️ dnd5e.monsters
- ☑️ dnd5e.spells
- ☑️ dnd5e.items
- → AI gets full creature, spell, and item database

**Analytics Dashboard:**
- ☑️ dnd5e.classes
- ☑️ dnd5e.races
- → Dashboard shows character creation options

**Full Backup:**
- ☑️ Check all compendia
- → Complete world + compendium backup to your server

### Compatibility

- ✅ Foundry VTT v11-13
- ✅ All game systems (D&D 5e, Pathfinder 2e, etc.)
- ✅ Works with any compendium module
- ✅ Backward compatible with v3.0.0 settings

### Upgrading from v3.0.0

No migration needed! Your existing settings will work:
- Empty `autoLoad` list? Just open settings and select compendia
- Already configured via console? Your settings are preserved

### Bug Fixes

- **Fixed:** Empty compendium list by default - now easy to configure via UI
- **Fixed:** No way to know what compendia are available - now shows all in UI
- **Fixed:** Had to remember exact pack IDs - now just check boxes

### Documentation

New guides added:
- `COMPENDIUM_SETUP.md` - Comprehensive setup guide
- Updated `README.md` with UI configuration info
- Updated `CHANGELOG.md` with all changes

### Testing

- ✅ All 77 unit tests passing
- ✅ TypeScript strict mode compilation
- ✅ ESLint passing (except pre-existing warnings in other files)

### What's Next?

Possible future enhancements:
- Filter compendia by type (Actors, Items, etc.)
- Search bar for compendia
- Bulk select/deselect all
- Show document count per compendium
- Preview compendium contents before loading

### Feedback

Found a bug? Have a suggestion?
→ Open an issue: https://github.com/alexivenkov/foundry-api-bridge-module/issues

---

**Enjoy the update!** 🎮🚀

*This release was developed with ❤️ by the Foundry API Bridge team.*
