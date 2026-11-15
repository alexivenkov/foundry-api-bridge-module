import {
  FolderCreationCancelledError,
  FolderNotFoundError,
  type Folder,
  type FolderStore,
  type FolderTree
} from '@/core/folders/domain';
import type {
  CreateFolderCommand,
  DeleteFolderCommand,
  GetFolderQuery,
  ListFoldersQuery,
  UpdateFolderCommand
} from './commands';

export interface FolderServiceDependencies {
  readonly folders: FolderStore;
}

export class FolderService {
  constructor(private readonly deps: FolderServiceDependencies) {}

  listFolders(query: ListFoldersQuery): readonly Folder[] {
    const folders = this.deps.folders.listFolders();
    return query.type === undefined ? folders : folders.filter((folder) => folder.type === query.type);
  }

  getFolder(query: GetFolderQuery): FolderTree {
    const tree = this.deps.folders.readTree(query.folderId, query.tree);
    if (tree === null) {
      throw new FolderNotFoundError(query.folderId);
    }
    return tree;
  }

  async createFolder(command: CreateFolderCommand): Promise<Folder> {
    const folder = await this.deps.folders.createFolder(command.draft);
    if (folder === null) {
      throw new FolderCreationCancelledError();
    }
    return folder;
  }

  async updateFolder(command: UpdateFolderCommand): Promise<Folder> {
    this.requireFolder(command.folderId);
    const updated = await this.deps.folders.updateFolder(command.folderId, command.changes);
    if (updated === null) {
      throw new FolderNotFoundError(command.folderId);
    }
    return updated;
  }

  async deleteFolder(command: DeleteFolderCommand): Promise<void> {
    this.requireFolder(command.folderId);
    await this.deps.folders.deleteFolder(command.folderId, command.options);
  }

  private requireFolder(folderId: string): Folder {
    const folder = this.deps.folders.findFolder(folderId);
    if (folder === null) {
      throw new FolderNotFoundError(folderId);
    }
    return folder;
  }
}
