import type { BrowseFilesParams, BrowseFilesResult } from '@/commands/types';
import { browseFilesRequestSchema, createFoundryFileService, toBrowseFilesQuery, type FileWiring } from '@/core/files';
import { parseRequest } from '@/core/shared';
import { toWireDirectoryListing } from './fileWireMappers';

export function createBrowseFilesHandler(
  wiring: FileWiring = {}
): (params: BrowseFilesParams) => Promise<BrowseFilesResult> {
  const service = createFoundryFileService(wiring);

  return async function browseFilesHandler(params: BrowseFilesParams): Promise<BrowseFilesResult> {
    const query = toBrowseFilesQuery(parseRequest(browseFilesRequestSchema, params));
    return toWireDirectoryListing(await service.browse(query));
  };
}

export const browseFilesHandler = createBrowseFilesHandler();
