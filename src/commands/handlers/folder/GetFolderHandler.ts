import type { GetFolderParams, GetFolderResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryFolderService, getFolderRequestSchema, toGetFolderQuery } from '@/core/folders';
import { toWireFolderTree, type FolderHandlerDependencies } from './folderWireMappers';

export function createGetFolderHandler(
  deps: FolderHandlerDependencies = {}
): (params: GetFolderParams) => Promise<GetFolderResult> {
  const service = createFoundryFolderService(deps.globals);

  return function getFolderHandler(params: GetFolderParams): Promise<GetFolderResult> {
    try {
      const query = toGetFolderQuery(parseRequest(getFolderRequestSchema, params));
      return Promise.resolve(toWireFolderTree(service.getFolder(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getFolderHandler = createGetFolderHandler();
