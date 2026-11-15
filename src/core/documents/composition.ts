import {
  DocumentFlagService,
  DocumentOwnershipService,
  DocumentSearchService,
  DocumentSortService,
  DocumentTransferService
} from './application';
import type { ScriptContentPolicy } from './domain';
import {
  FoundryDocumentExporter,
  FoundryDocumentFlagStore,
  FoundryDocumentImporter,
  FoundryDocumentIndexReader,
  FoundryDocumentOwnershipStore,
  FoundryDocumentSortStore,
  documentGlobalsFromGlobalThis,
  macroScriptContentPolicy,
  type DocumentGlobalsProvider
} from './infrastructure';

export interface DocumentWiring {
  readonly globals?: DocumentGlobalsProvider;
  readonly scripts?: ScriptContentPolicy;
  /** The running Foundry generation; defaults to `foundryGeneration()`. */
  readonly generation?: () => number;
}

export const defaultDocumentGlobals: DocumentGlobalsProvider = documentGlobalsFromGlobalThis;

// Composition root of the context. Handlers pass custom wiring only in tests.

export function createFoundryDocumentOwnershipService(wiring: DocumentWiring = {}): DocumentOwnershipService {
  return new DocumentOwnershipService({
    documents: new FoundryDocumentOwnershipStore(wiring.globals ?? defaultDocumentGlobals)
  });
}

export function createFoundryDocumentFlagService(wiring: DocumentWiring = {}): DocumentFlagService {
  return new DocumentFlagService({
    documents: new FoundryDocumentFlagStore(wiring.globals ?? defaultDocumentGlobals),
    scripts: wiring.scripts ?? macroScriptContentPolicy
  });
}

export function createFoundryDocumentSortService(wiring: DocumentWiring = {}): DocumentSortService {
  return new DocumentSortService({ documents: new FoundryDocumentSortStore(wiring.globals ?? defaultDocumentGlobals) });
}

export function createFoundryDocumentSearchService(wiring: DocumentWiring = {}): DocumentSearchService {
  return new DocumentSearchService({ index: new FoundryDocumentIndexReader(wiring.globals ?? defaultDocumentGlobals) });
}

export function createFoundryDocumentTransferService(wiring: DocumentWiring = {}): DocumentTransferService {
  const globals = wiring.globals ?? defaultDocumentGlobals;
  return new DocumentTransferService({
    exporter: new FoundryDocumentExporter(globals, wiring.generation),
    importer: new FoundryDocumentImporter(globals),
    scripts: wiring.scripts ?? macroScriptContentPolicy
  });
}
