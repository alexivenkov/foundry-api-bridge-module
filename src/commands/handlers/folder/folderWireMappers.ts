import type { FolderDocumentType, FolderSummary, FolderTreeEntry } from '@/commands/types';
import type { Folder, FolderGlobalsProvider, FolderTree } from '@/core/folders';

export interface FolderHandlerDependencies {
  globals?: FolderGlobalsProvider;
}

export function toWireFolder(folder: Folder): FolderSummary {
  return {
    id: folder.id,
    name: folder.name,
    type: folder.type as FolderDocumentType,
    color: folder.color,
    description: folder.description,
    parentId: folder.parentId,
    sort: folder.sort
  };
}

export function toWireFolderTree(tree: FolderTree): FolderTreeEntry {
  const entry: FolderTreeEntry = {
    ...toWireFolder(tree),
    subfolders: tree.subfolders.map(toWireFolderTree)
  };
  if (tree.contentIds !== undefined) {
    entry.contentIds = [...tree.contentIds];
  }
  return entry;
}
