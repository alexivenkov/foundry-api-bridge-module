import type { CreateFolderParams, CreateFolderResult } from '@/commands/types';
import { getFolderClass, mapFolderToSummary } from './folderTypes';

export async function createFolderHandler(params: CreateFolderParams): Promise<CreateFolderResult> {
  const data: Record<string, unknown> = {
    name: params.name,
    type: params.type
  };

  if (params.parentId !== undefined) {
    data['folder'] = params.parentId;
  }

  if (params.color !== undefined) {
    data['color'] = params.color;
  }

  if (params.description !== undefined) {
    data['description'] = params.description;
  }

  if (params.sort !== undefined) {
    data['sort'] = params.sort;
  }

  const folder = await getFolderClass().create(data);
  return mapFolderToSummary(folder);
}
