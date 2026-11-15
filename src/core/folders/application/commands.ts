import type { FolderChanges, FolderDeletionOptions, FolderDraft, FolderTreeOptions } from '@/core/folders/domain';

export interface ListFoldersQuery {
  /** Omitted: folders of every document type. */
  readonly type: string | undefined;
}

export interface GetFolderQuery {
  readonly folderId: string;
  readonly tree: FolderTreeOptions;
}

export interface CreateFolderCommand {
  readonly draft: FolderDraft;
}

export interface UpdateFolderCommand {
  readonly folderId: string;
  readonly changes: FolderChanges;
}

export interface DeleteFolderCommand {
  readonly folderId: string;
  readonly options: FolderDeletionOptions;
}
