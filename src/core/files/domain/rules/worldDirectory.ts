import {
  PathOutsideWorldError,
  ProtectedWorldFolderError,
  WorldDirectoryItselfError
} from '@/core/files/domain/errors/fileErrors';
import { assertWritableSegments, type StoragePath } from '@/core/files/domain/value-objects/storagePath';

/** The world's own databases (`data/`, LevelDB) and compendium packs (`packs/`). */
const PROTECTED_WORLD_FOLDERS = ['data', 'packs'];

export interface WritablePathOptions {
  /** The world directory itself is a valid target (an upload), not only what lies below it. */
  readonly allowWorldRoot: boolean;
  readonly field: string;
}

/**
 * Writes are confined to the current world's directory in the `data` source:
 * never `systems/`, `modules/`, another world or the data root, and never the
 * world's database folders. Hosts with a case-insensitive file system (macOS,
 * Windows) resolve `DATA` to `data`, so that check ignores case; the world
 * prefix itself must match exactly.
 */
export function assertWritableWorldPath(path: StoragePath, worldId: string, options: WritablePathOptions): void {
  assertWritableSegments(path, options.field);
  const [root, world, folder] = path.segments;
  const display = path.toString();
  if (root !== 'worlds' || world !== worldId) {
    throw new PathOutsideWorldError(display, worldId);
  }
  if (folder === undefined) {
    if (!options.allowWorldRoot) {
      throw new WorldDirectoryItselfError(display);
    }
    return;
  }
  const protectedFolder = PROTECTED_WORLD_FOLDERS.find((name) => name === folder.toLowerCase());
  if (protectedFolder !== undefined) {
    throw new ProtectedWorldFolderError(display, protectedFolder);
  }
}
