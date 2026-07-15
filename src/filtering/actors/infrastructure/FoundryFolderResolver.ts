import { FoundryFolderResolver as SharedFoundryFolderResolver } from '@/kernel/infrastructure';
import type { FoundryFolderGameProvider } from '@/kernel/infrastructure';

const ACTOR_FOLDER_TYPE = 'Actor';

export class FoundryFolderResolver extends SharedFoundryFolderResolver {
  constructor(gameProvider: FoundryFolderGameProvider) {
    super(gameProvider, ACTOR_FOLDER_TYPE);
  }
}
