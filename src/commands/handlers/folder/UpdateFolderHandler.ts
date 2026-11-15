import type { UpdateFolderParams, UpdateFolderResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryFolderService, toUpdateFolderCommand, updateFolderRequestSchema } from '@/core/folders';
import { toWireFolder, type FolderHandlerDependencies } from './folderWireMappers';

export function createUpdateFolderHandler(
  deps: FolderHandlerDependencies = {}
): (params: UpdateFolderParams) => Promise<UpdateFolderResult> {
  const service = createFoundryFolderService(deps.globals);

  return async function updateFolderHandler(params: UpdateFolderParams): Promise<UpdateFolderResult> {
    const command = toUpdateFolderCommand(parseRequest(updateFolderRequestSchema, params));
    return toWireFolder(await service.updateFolder(command));
  };
}

export const updateFolderHandler = createUpdateFolderHandler();
