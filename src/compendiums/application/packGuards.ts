import {
  PackLockedError,
  PackNotFoundError,
  WorldFolderNotFoundError,
  WorldFolderTypeMismatchError
} from '@/compendiums/domain';
import type { PackInfo, PackManager, WorldDirectory, WorldFolderRef } from '@/compendiums/domain';

export function requirePackInfo(packs: PackManager, packId: string): PackInfo {
  const info = packs.readPackInfo(packId);
  if (info === null) {
    throw new PackNotFoundError(packId);
  }
  return info;
}

export function requireUnlockedPack(packs: PackManager, packId: string): PackInfo {
  const info = requirePackInfo(packs, packId);
  if (info.locked) {
    throw new PackLockedError(packId);
  }
  return info;
}

export function requireWorldFolder(
  world: WorldDirectory,
  folderId: string,
  expectedType: string
): WorldFolderRef {
  const folder = world.findFolder(folderId);
  if (folder === null) {
    throw new WorldFolderNotFoundError(folderId);
  }
  if (folder.type !== expectedType) {
    throw new WorldFolderTypeMismatchError(folderId, folder.type, expectedType);
  }
  return folder;
}
