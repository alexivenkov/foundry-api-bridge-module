import { FolderService } from './application';
import { FoundryFolderStore, type FolderGlobalsProvider } from './infrastructure';

// Composition root of the context. Handlers pass custom globals only in tests.
export function createFoundryFolderService(globals?: FolderGlobalsProvider): FolderService {
  return new FolderService({ folders: new FoundryFolderStore(globals) });
}
