import type { CreateFolderParams, CreateFolderResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFolderRequestSchema, createFoundryFolderService, toCreateFolderCommand } from '@/core/folders';
import { toWireFolder, type FolderHandlerDependencies } from './folderWireMappers';

export function createCreateFolderHandler(
  deps: FolderHandlerDependencies = {}
): (params: CreateFolderParams) => Promise<CreateFolderResult> {
  const service = createFoundryFolderService(deps.globals);

  return async function createFolderHandler(params: CreateFolderParams): Promise<CreateFolderResult> {
    const command = toCreateFolderCommand(parseRequest(createFolderRequestSchema, params));
    return toWireFolder(await service.createFolder(command));
  };
}

export const createFolderHandler = createCreateFolderHandler();
