import type { CreateCompendiumParams, CreateCompendiumResult } from '@/commands/types';
import {
  createCompendiumRequestSchema,
  createFoundryCompendiumManagementService,
  toCreatePackCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWirePackInfo } from './compendiumManagementWireMappers';

export function createCreateCompendiumHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: CreateCompendiumParams) => Promise<CreateCompendiumResult> {
  const service = createFoundryCompendiumManagementService(deps);

  return async function createCompendiumHandler(params: CreateCompendiumParams): Promise<CreateCompendiumResult> {
    const command = toCreatePackCommand(parseRequest(createCompendiumRequestSchema, params));
    return toWirePackInfo(await service.create(command));
  };
}

export const createCompendiumHandler = createCreateCompendiumHandler();
