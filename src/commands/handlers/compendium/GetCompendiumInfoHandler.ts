import type { GetCompendiumInfoParams, GetCompendiumInfoResult } from '@/commands/types';
import {
  createFoundryCompendiumManagementService,
  packIdRequestSchema,
  type PackManagementWiring
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import { toWirePackInfo } from './compendiumManagementWireMappers';

export type CompendiumHandlerDependencies = PackManagementWiring;

export function createGetCompendiumInfoHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: GetCompendiumInfoParams) => Promise<GetCompendiumInfoResult> {
  const service = createFoundryCompendiumManagementService(deps);

  return function getCompendiumInfoHandler(params: GetCompendiumInfoParams): Promise<GetCompendiumInfoResult> {
    try {
      const { packId } = parseRequest(packIdRequestSchema, params);
      return Promise.resolve(toWirePackInfo(service.getInfo(packId)));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getCompendiumInfoHandler = createGetCompendiumInfoHandler();
