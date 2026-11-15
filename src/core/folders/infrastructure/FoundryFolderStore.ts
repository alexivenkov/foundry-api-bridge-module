import type {
  Folder,
  FolderChanges,
  FolderDeletionOptions,
  FolderDraft,
  FolderStore,
  FolderTree,
  FolderTreeOptions
} from '@/core/folders/domain';
import {
  toFolder,
  toFolderTree,
  toFoundryDeletionOptions,
  toFoundryFolderChanges,
  toFoundryFolderData
} from './folderMapper';
import type { FoundryFolderGlobals, FoundryFoldersCollection } from './foundryFolderTypes';

export type FolderGlobalsProvider = () => FoundryFolderGlobals;

const fromGlobalThis: FolderGlobalsProvider = () => globalThis as unknown as FoundryFolderGlobals;

/** Anti-corruption layer over the world's Folder documents. */
export class FoundryFolderStore implements FolderStore {
  constructor(private readonly globals: FolderGlobalsProvider = fromGlobalThis) {}

  listFolders(): readonly Folder[] {
    return this.folders().contents.map(toFolder);
  }

  findFolder(folderId: string): Folder | null {
    const document = this.folders().get(folderId);
    return document !== undefined ? toFolder(document) : null;
  }

  readTree(folderId: string, options: FolderTreeOptions): FolderTree | null {
    const document = this.folders().get(folderId);
    return document !== undefined ? toFolderTree(document, options) : null;
  }

  async createFolder(draft: FolderDraft): Promise<Folder | null> {
    const document = await this.globals().Folder.create(toFoundryFolderData(draft));
    return document ? toFolder(document) : null;
  }

  async updateFolder(folderId: string, changes: FolderChanges): Promise<Folder | null> {
    const document = this.folders().get(folderId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryFolderChanges(changes));
    return toFolder(document);
  }

  async deleteFolder(folderId: string, options: FolderDeletionOptions): Promise<void> {
    await this.folders().get(folderId)?.delete(toFoundryDeletionOptions(options));
  }

  private folders(): FoundryFoldersCollection {
    return this.globals().game.folders;
  }
}
