import {
  AdventureImportService,
  CompendiumBulkImportService,
  CompendiumManagementService,
  CompendiumWritingService,
  createCompendiumImportService,
  createCompendiumQueryService,
  createUuidResolutionService,
  type CompendiumImportService,
  type CompendiumQueryService,
  type UuidResolutionService
} from './application';
import type { ScriptMacroImportPolicy } from './domain';
import {
  FoundryActorInventory,
  FoundryAdventureGateway,
  FoundryPackContentWriter,
  FoundryPackManager,
  FoundryWorldBulkImporter,
  FoundryWorldDirectory,
  createPackManagementGlobals,
  defaultPackManagementGameProvider,
  type PackManagementGameProvider,
  type PackManagementGlobals,
  FoundryPackCatalog,
  FoundryPackDocumentReader,
  FoundryPackIndexReader,
  FoundryPackIndexScanner,
  FoundryPackSearchEngine,
  FoundryUuidResolver,
  FoundryWorldImporter,
  defaultCompendiumGameProvider,
  moduleSettingScriptMacroImportPolicy,
  type CompendiumGameProvider,
  type FromUuidFn
} from './infrastructure';

// Composition root of the context: wires Foundry-backed adapters into the
// application services. Handlers pass a custom provider only in tests.
export function createFoundryCompendiumQueryService(
  gameProvider: CompendiumGameProvider = defaultCompendiumGameProvider
): CompendiumQueryService {
  return createCompendiumQueryService({
    catalog: new FoundryPackCatalog(gameProvider),
    indexReader: new FoundryPackIndexReader(gameProvider),
    indexScanner: new FoundryPackIndexScanner(gameProvider),
    searchEngine: new FoundryPackSearchEngine(gameProvider),
    documentReader: new FoundryPackDocumentReader(gameProvider)
  });
}

export function createFoundryCompendiumImportService(
  gameProvider: CompendiumGameProvider = defaultCompendiumGameProvider,
  scripts: ScriptMacroImportPolicy = moduleSettingScriptMacroImportPolicy
): CompendiumImportService {
  return createCompendiumImportService({
    catalog: new FoundryPackCatalog(gameProvider),
    documentReader: new FoundryPackDocumentReader(gameProvider),
    worldImporter: new FoundryWorldImporter(gameProvider),
    actorInventory: new FoundryActorInventory(gameProvider),
    scripts
  });
}

export function createFoundryUuidResolutionService(
  fromUuid?: FromUuidFn
): UuidResolutionService {
  return createUuidResolutionService({
    resolver: new FoundryUuidResolver(fromUuid)
  });
}

export interface PackManagementWiring {
  readonly gameProvider?: PackManagementGameProvider | undefined;
  readonly globals?: PackManagementGlobals | undefined;
  readonly generation?: (() => number) | undefined;
  /** The script opt-in; defaults to the module's "Allow Script Macros" setting. */
  readonly scripts?: ScriptMacroImportPolicy | undefined;
}

interface ResolvedWiring {
  readonly gameProvider: PackManagementGameProvider;
  readonly globals: PackManagementGlobals;
  readonly generation: (() => number) | undefined;
  readonly scripts: ScriptMacroImportPolicy;
}

function resolveWiring(wiring: PackManagementWiring): ResolvedWiring {
  return {
    gameProvider: wiring.gameProvider ?? defaultPackManagementGameProvider,
    globals: wiring.globals ?? createPackManagementGlobals(wiring.generation),
    generation: wiring.generation,
    scripts: wiring.scripts ?? moduleSettingScriptMacroImportPolicy
  };
}

export function createFoundryCompendiumManagementService(
  wiring: PackManagementWiring = {}
): CompendiumManagementService {
  const { gameProvider, globals } = resolveWiring(wiring);
  return new CompendiumManagementService({
    packs: new FoundryPackManager(gameProvider, globals),
    world: new FoundryWorldDirectory(gameProvider)
  });
}

export function createFoundryCompendiumWritingService(
  wiring: PackManagementWiring = {}
): CompendiumWritingService {
  const { gameProvider, globals, scripts } = resolveWiring(wiring);
  return new CompendiumWritingService({
    packs: new FoundryPackManager(gameProvider, globals),
    world: new FoundryWorldDirectory(gameProvider),
    writer: new FoundryPackContentWriter(gameProvider),
    scripts
  });
}

export function createFoundryCompendiumBulkImportService(
  wiring: PackManagementWiring = {}
): CompendiumBulkImportService {
  const { gameProvider, globals, generation, scripts } = resolveWiring(wiring);
  return new CompendiumBulkImportService({
    packs: new FoundryPackManager(gameProvider, globals),
    world: new FoundryWorldDirectory(gameProvider),
    importer: new FoundryWorldBulkImporter(gameProvider, globals, generation),
    scripts
  });
}

export function createFoundryAdventureImportService(
  wiring: PackManagementWiring = {}
): AdventureImportService {
  const { gameProvider, globals, scripts } = resolveWiring(wiring);
  return new AdventureImportService({
    packs: new FoundryPackManager(gameProvider, globals),
    adventures: new FoundryAdventureGateway(gameProvider, globals),
    scripts
  });
}
