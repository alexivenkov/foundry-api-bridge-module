import type { FolderResolver } from '@/filtering/actors/application';
import type { FolderReference } from '@/filtering/actors/domain/value-objects';

import type { FoundryFolderDocument } from './foundryActorTypes';
import type { FoundryGameProvider } from './foundryGameProvider';

const ACTOR_FOLDER_TYPE = 'Actor';

export class FoundryFolderResolver implements FolderResolver {
  constructor(private readonly gameProvider: FoundryGameProvider) {}

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
    if (byId !== undefined && byId.type !== ACTOR_FOLDER_TYPE) {
      return [];
    }

    const refName = ref.name;
    const byName: FoundryFolderDocument[] =
      refName !== undefined
        ? game.folders.contents.filter(
            (f) =>
              f.type === ACTOR_FOLDER_TYPE &&
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
