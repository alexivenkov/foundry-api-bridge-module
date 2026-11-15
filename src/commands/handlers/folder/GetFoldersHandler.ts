import type { GetFoldersParams, GetFoldersResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryFolderService, getFoldersRequestSchema, toListFoldersQuery } from '@/core/folders';
import { toWireFolder, type FolderHandlerDependencies } from './folderWireMappers';

export function createGetFoldersHandler(
  deps: FolderHandlerDependencies = {}
): (params: GetFoldersParams) => Promise<GetFoldersResult> {
  const service = createFoundryFolderService(deps.globals);

  return function getFoldersHandler(params: GetFoldersParams): Promise<GetFoldersResult> {
    try {
      const query = toListFoldersQuery(parseRequest(getFoldersRequestSchema, params));
      return Promise.resolve(service.listFolders(query).map(toWireFolder));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getFoldersHandler = createGetFoldersHandler();
