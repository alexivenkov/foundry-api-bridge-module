import type {
  Folder,
  FolderChanges,
  FolderDeletionOptions,
  FolderDraft,
  FolderTree,
  FolderTreeOptions
} from '@/core/folders/domain/model/Folder';

// Reads are synchronous: the world's folders live in memory. `createFolder`
// resolves to null when the core created nothing; `updateFolder` when the
// folder is gone.
export interface FolderStore {
  listFolders(): readonly Folder[];
  findFolder(folderId: string): Folder | null;
  /** The folder with what lies under it, as the core's directory tree has it. */
  readTree(folderId: string, options: FolderTreeOptions): FolderTree | null;
  createFolder(draft: FolderDraft): Promise<Folder | null>;
  updateFolder(folderId: string, changes: FolderChanges): Promise<Folder | null>;
  deleteFolder(folderId: string, options: FolderDeletionOptions): Promise<void>;
}
