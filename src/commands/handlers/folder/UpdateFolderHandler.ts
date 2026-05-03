import type { UpdateFolderParams, UpdateFolderResult } from '@/commands/types';
import { getGame, mapFolderToSummary } from './folderTypes';

export async function updateFolderHandler(params: UpdateFolderParams): Promise<UpdateFolderResult> {
  const folder = getGame().folders.get(params.folderId);
  if (!folder) {
    throw new Error(`Folder not found: ${params.folderId}`);
  }

  const updateData: Record<string, unknown> = {};

  if (params.name !== undefined) {
    updateData['name'] = params.name;
  }

  if (params.parentId !== undefined) {
    updateData['folder'] = params.parentId;
  }

  if (params.color !== undefined) {
    updateData['color'] = params.color;
  }

  if (params.description !== undefined) {
    updateData['description'] = params.description;
  }

  if (params.sort !== undefined) {
    updateData['sort'] = params.sort;
  }

  const updated = await folder.update(updateData);
  return mapFolderToSummary(updated);
}
