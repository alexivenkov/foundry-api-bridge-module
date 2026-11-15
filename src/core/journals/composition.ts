import { foundryGeneration } from '@/compat/foundryVersion';
import { JournalCategoryService, JournalSearchService, JournalService, JournalSharingService } from './application';
import {
  FoundryImageSharer,
  FoundryJournalCategoryStore,
  FoundryJournalStore,
  FoundryNoteNavigator,
  FoundryTextEnricher,
  FoundryUserDirectory,
  type FoundryJournalGlobals,
  type JournalGlobalsProvider
} from './infrastructure';

// The globals are read on every call, so a service can be composed before Foundry is ready.
export const defaultJournalGlobals: JournalGlobalsProvider = () => globalThis as unknown as FoundryJournalGlobals;

/** The running Foundry generation; injected only in tests. */
export type FoundryGenerationReader = () => number;

// Composition root of the context. Handlers pass a custom provider only in tests.
export function createFoundryJournalService(
  globals: JournalGlobalsProvider = defaultJournalGlobals,
  generation: FoundryGenerationReader = foundryGeneration
): JournalService {
  const store = new FoundryJournalStore(globals, generation);
  return new JournalService({
    journals: store,
    presenter: store,
    enricher: new FoundryTextEnricher(globals),
    categories: new FoundryJournalCategoryStore(globals, generation)
  });
}

export function createFoundryJournalCategoryService(
  globals: JournalGlobalsProvider = defaultJournalGlobals,
  generation: FoundryGenerationReader = foundryGeneration
): JournalCategoryService {
  return new JournalCategoryService({
    journals: new FoundryJournalStore(globals, generation),
    categories: new FoundryJournalCategoryStore(globals, generation)
  });
}

export function createFoundryJournalSearchService(
  globals: JournalGlobalsProvider = defaultJournalGlobals
): JournalSearchService {
  return new JournalSearchService({ journals: new FoundryJournalStore(globals) });
}

export function createFoundryJournalSharingService(
  globals: JournalGlobalsProvider = defaultJournalGlobals
): JournalSharingService {
  return new JournalSharingService({
    journals: new FoundryJournalStore(globals),
    images: new FoundryImageSharer(globals),
    users: new FoundryUserDirectory(globals),
    notes: new FoundryNoteNavigator(globals)
  });
}
