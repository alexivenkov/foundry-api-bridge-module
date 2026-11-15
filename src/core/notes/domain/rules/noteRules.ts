import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import { UnknownNoteLevelError } from '@/core/notes/domain/errors/UnknownNoteLevelError';
import type { NoteChanges } from '@/core/notes/domain/model/Note';
import type { NoteFeatures } from '@/core/notes/domain/ports/NoteEnvironment';

export function assertNoteFeatures(changes: NoteChanges, features: NoteFeatures): void {
  if (!features.levels && (changes.locked !== undefined || changes.levels !== undefined)) {
    throw new CoreFeatureUnavailableError('Note locks and scene levels require Foundry 14 or newer');
  }
}

/** The core only checks the id format, so a level that is not in the scene is refused here. */
export function assertNoteLevels(levels: readonly string[] | undefined, sceneLevelIds: readonly string[]): void {
  const unknown = levels?.find((levelId) => !sceneLevelIds.includes(levelId));
  if (unknown !== undefined) {
    throw new UnknownNoteLevelError(unknown);
  }
}
