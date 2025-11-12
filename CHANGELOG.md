# Changelog

All notable changes to this project will be documented in this file.

## [3.1.0] - 2025-11-12

### Added
- ✨ **Premium UI Compendium Selection** - Beautiful, user-friendly interface for selecting compendia
  - 🔍 **Live search/filter** - Instant search across name, ID, and type
  - ✅ **Bulk actions** - "Select All" and "Deselect All" buttons (respects search filter)
  - 📊 **Live counter** - Shows "X of Y selected" in real-time
  - 🎨 **Rich compendium cards** - Icons, type badges, and document counts
  - 🏷️ **Color-coded badges** - Visual distinction by document type (Actor/Item/Journal/etc.)
  - 📈 **Document counts** - See how many documents each compendium contains
  - 🎯 **Smart sorting** - Checked items appear first, then alphabetically
  - ✨ **Smooth animations** - Hover effects and transitions
  - ♿ **Accessibility** - Keyboard navigation and screen reader support
- 📋 Detailed compendium setup guide (COMPENDIUM_SETUP.md)
- 📖 Comprehensive UI improvements guide (UI_IMPROVEMENTS.md)
- 🎨 Professional CSS styling with Foundry VTT design language

### Changed
- Settings form now displays available compendia with full metadata
- Compendium selection automatically triggers auto-load on save
- Improved user feedback with notifications after configuration save
- Enhanced visual hierarchy and spacing throughout the form

### Fixed
- **Empty compendium list by default** - Users can now easily select compendia through UI instead of console commands
- Improved readability with monospace IDs and clear labels

## [3.0.0] - 2024-11-08

### Added
- ✨ Complete TypeScript rewrite with strict type checking (no `any` types)
- ⚙️ UI-based configuration via Foundry settings menu
- 🎨 Beautiful configuration form with proper styling
- 📦 Modern build system with Vite
- 🧪 Comprehensive unit test coverage (77 tests)
- 🔍 ESLint 9 with strict TypeScript rules
- 📝 JSON Schema validation for configuration
- 🎯 Modular architecture with clean separation of concerns

### Changed
- Configuration now managed via Foundry UI instead of manual JSON editing
- Settings stored in Foundry database instead of config.json file
- Updated to work with Foundry VTT v11-13
- Improved error handling and logging

### Technical
- TypeScript 5.6 with strictest possible settings
- Vite 5.4 for fast builds
- Jest 29 for testing
- 77 unit tests with good coverage
- Clean architecture: collectors, API client, config manager, settings manager

## [2.2.0] - 2024-11-06

### Added
- AUTO-LOAD functionality for compendia
- Configurable auto-load list in config.json

## [2.1.0] - 2024-11-06

### Added
- Compendium support
- Load and send compendium data to API server

## [2.0.0] - Initial Release

### Added
- Core world data collection (journals, actors, scenes, items)
- Periodic updates to external API server
- Basic configuration via config.json
