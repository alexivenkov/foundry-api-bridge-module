import {
  createCompendiumImportService,
  createCompendiumQueryService,
  createUuidResolutionService,
  type CompendiumImportService,
  type CompendiumQueryService,
  type UuidResolutionService
} from './application';
import {
  FoundryActorInventory,
  FoundryPackCatalog,
  FoundryPackDocumentReader,
  FoundryPackIndexReader,
  FoundryPackIndexScanner,
  FoundryPackSearchEngine,
  FoundryUuidResolver,
  FoundryWorldImporter,
  defaultCompendiumGameProvider,
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
  gameProvider: CompendiumGameProvider = defaultCompendiumGameProvider
): CompendiumImportService {
  return createCompendiumImportService({
    catalog: new FoundryPackCatalog(gameProvider),
    documentReader: new FoundryPackDocumentReader(gameProvider),
    worldImporter: new FoundryWorldImporter(gameProvider),
    actorInventory: new FoundryActorInventory(gameProvider)
  });
}

export function createFoundryUuidResolutionService(
  fromUuid?: FromUuidFn
): UuidResolutionService {
  return createUuidResolutionService({
    resolver: new FoundryUuidResolver(fromUuid)
  });
}
