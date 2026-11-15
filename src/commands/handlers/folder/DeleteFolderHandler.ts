import type { DeleteFolderParams, DeleteFolderResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryFolderService, deleteFolderRequestSchema, toDeleteFolderCommand } from '@/core/folders';
import type { FolderHandlerDependencies } from './folderWireMappers';

export function createDeleteFolderHandler(
  deps: FolderHandlerDependencies = {}
): (params: DeleteFolderParams) => Promise<DeleteFolderResult> {
  const service = createFoundryFolderService(deps.globals);

  return async function deleteFolderHandler(params: DeleteFolderParams): Promise<DeleteFolderResult> {
    const command = toDeleteFolderCommand(parseRequest(deleteFolderRequestSchema, params));
    await service.deleteFolder(command);
    return { deleted: true, folderId: command.folderId };
  };
}

export const deleteFolderHandler = createDeleteFolderHandler();
