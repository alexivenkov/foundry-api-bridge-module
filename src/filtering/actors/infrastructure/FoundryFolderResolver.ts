import { FoundryFolderResolver as SharedFoundryFolderResolver } from '@/filtering/shared/infrastructure';
import type { FoundryFolderGameProvider } from '@/filtering/shared/infrastructure';

const ACTOR_FOLDER_TYPE = 'Actor';

export class FoundryFolderResolver extends SharedFoundryFolderResolver {
  constructor(gameProvider: FoundryFolderGameProvider) {
    super(gameProvider, ACTOR_FOLDER_TYPE);
  }
}
