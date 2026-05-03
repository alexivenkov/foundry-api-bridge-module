import type { GetFoldersParams, GetFoldersResult } from '@/commands/types';
import { getGame, mapFolderToSummary } from './folderTypes';

export function getFoldersHandler(params: GetFoldersParams): Promise<GetFoldersResult> {
  const all = getGame().folders.contents;
  const filtered = params.type !== undefined
    ? all.filter(f => f.type === params.type)
    : all;
  return Promise.resolve(filtered.map(mapFolderToSummary));
}
