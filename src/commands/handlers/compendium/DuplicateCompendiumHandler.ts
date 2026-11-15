import type { DuplicateCompendiumParams, DuplicateCompendiumResult } from '@/commands/types';
import {
  createFoundryCompendiumManagementService,
  duplicateCompendiumRequestSchema,
  toDuplicatePackCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWirePackInfo } from './compendiumManagementWireMappers';

export function createDuplicateCompendiumHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: DuplicateCompendiumParams) => Promise<DuplicateCompendiumResult> {
  const service = createFoundryCompendiumManagementService(deps);

  return async function duplicateCompendiumHandler(
    params: DuplicateCompendiumParams
  ): Promise<DuplicateCompendiumResult> {
    const command = toDuplicatePackCommand(parseRequest(duplicateCompendiumRequestSchema, params));
    return toWirePackInfo(await service.duplicate(command));
  };
}

export const duplicateCompendiumHandler = createDuplicateCompendiumHandler();
