# Changelog

All notable changes to this project will be documented in this file.

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
