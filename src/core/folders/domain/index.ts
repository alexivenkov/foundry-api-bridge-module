export type {
  Folder,
  FolderChanges,
  FolderDeletionOptions,
  FolderDraft,
  FolderTree,
  FolderTreeOptions
} from './model/Folder';
export { FolderNotFoundError } from './errors/FolderNotFoundError';
export { FolderCreationCancelledError } from './errors/FolderCreationCancelledError';
export type { FolderStore } from './ports/FolderStore';
