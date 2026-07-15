import type { FolderReference } from '@/kernel/domain/value-objects/FolderReference';
import type { FolderResolver } from '@/kernel/domain/repository/FolderResolver';

import type {
  FoundryFolderDocument,
  FoundryFolderGameProvider
} from './foundryFolderTypes';

export class FoundryFolderResolver implements FolderResolver {
  constructor(
    private readonly gameProvider: FoundryFolderGameProvider,
    private readonly folderType: string
  ) {}

  resolve(ref: FolderReference): ReadonlySet<string> {
    const candidateFolders = this.findFolders(ref);
    if (candidateFolders.length === 0) {
      return new Set();
    }

    const allIds = new Set<string>();
    for (const folder of candidateFolders) {
      allIds.add(folder.id);
      if (ref.recursive) {
        for (const sub of folder.getSubfolders(true)) {
          allIds.add(sub.id);
        }
      }
    }
    return allIds;
  }

  private findFolders(ref: FolderReference): FoundryFolderDocument[] {
    const game = this.gameProvider.getGame();

    const byId = ref.id !== undefined ? game.folders.get(ref.id) : undefined;
    if (byId !== undefined && byId.type !== this.folderType) {
      return [];
    }

    const refName = ref.name;
    const byName: FoundryFolderDocument[] =
      refName !== undefined
        ? game.folders.contents.filter(
            (f) =>
              f.type === this.folderType &&
              f.name.toLowerCase() === refName.toLowerCase()
          )
        : [];

    if (ref.id !== undefined && ref.name !== undefined) {
      if (byId !== undefined && byName.some((f) => f.id === byId.id)) {
        return [byId];
      }
      return [];
    }
    if (ref.id !== undefined) {
      return byId !== undefined ? [byId] : [];
    }
    return byName;
  }
}
