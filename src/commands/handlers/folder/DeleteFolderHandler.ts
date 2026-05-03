import type { DeleteFolderParams, DeleteFolderResult } from '@/commands/types';
import { getGame } from './folderTypes';

export async function deleteFolderHandler(params: DeleteFolderParams): Promise<DeleteFolderResult> {
  const folder = getGame().folders.get(params.folderId);
  if (!folder) {
    throw new Error(`Folder not found: ${params.folderId}`);
  }

  const options: { deleteSubfolders?: boolean; deleteContents?: boolean } = {};
  if (params.deleteSubfolders !== undefined) {
    options.deleteSubfolders = params.deleteSubfolders;
  }
  if (params.deleteContents !== undefined) {
    options.deleteContents = params.deleteContents;
  }

  await folder.delete(options);

  return {
    deleted: true,
    folderId: params.folderId
  };
}
