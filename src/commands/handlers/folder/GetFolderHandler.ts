import type { GetFolderParams, GetFolderResult, FolderTreeEntry } from '@/commands/types';
import { getGame, mapFolderToSummary, type FoundryFolderDoc } from './folderTypes';

function buildTree(folder: FoundryFolderDoc, includeSubfolders: boolean, includeContents: boolean): FolderTreeEntry {
  const summary = mapFolderToSummary(folder);
  const subfolders: FolderTreeEntry[] = includeSubfolders
    ? folder.children.map(child => buildTree(child, true, includeContents))
    : [];

  const entry: FolderTreeEntry = {
    ...summary,
    subfolders
  };

  if (includeContents) {
    entry.contentIds = folder.contents.map(d => d.id);
  }

  return entry;
}

export function getFolderHandler(params: GetFolderParams): Promise<GetFolderResult> {
  const folder = getGame().folders.get(params.folderId);
  if (!folder) {
    return Promise.reject(new Error(`Folder not found: ${params.folderId}`));
  }

  const includeSubfolders = params.includeSubfolders !== false;
  const includeContents = params.includeContents === true;

  return Promise.resolve(buildTree(folder, includeSubfolders, includeContents));
}
