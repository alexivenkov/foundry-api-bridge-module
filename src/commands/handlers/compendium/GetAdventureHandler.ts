import type { GetAdventureParams, GetAdventureResult } from '@/commands/types';
import { createFoundryAdventureImportService, getAdventureRequestSchema, toGetAdventureQuery } from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWireAdventure } from './compendiumManagementWireMappers';

export function createGetAdventureHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: GetAdventureParams) => Promise<GetAdventureResult> {
  const service = createFoundryAdventureImportService(deps);

  return async function getAdventureHandler(params: GetAdventureParams): Promise<GetAdventureResult> {
    const query = toGetAdventureQuery(parseRequest(getAdventureRequestSchema, params));
    return toWireAdventure(await service.getAdventure(query));
  };
}

export const getAdventureHandler = createGetAdventureHandler();
