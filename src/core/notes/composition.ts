import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { NoteService } from './application';
import { FoundryNoteEnvironment, FoundryNoteStore, type FoundryNoteGame, type NoteGameProvider } from './infrastructure';

export const defaultNoteGameProvider: NoteGameProvider = globalGameProvider<FoundryNoteGame>();

// Composition root of the context. Handlers pass a custom provider only in tests.
export function createFoundryNoteService(
  gameProvider: NoteGameProvider = defaultNoteGameProvider,
  generation?: () => number
): NoteService {
  return new NoteService({
    scenes: new FoundrySceneLocator(gameProvider),
    notes: new FoundryNoteStore(gameProvider),
    environment: new FoundryNoteEnvironment(gameProvider, generation)
  });
}
