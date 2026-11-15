import type { ConfigureCompendiumParams, ConfigureCompendiumResult } from '@/commands/types';
import {
  configureCompendiumRequestSchema,
  createFoundryCompendiumManagementService,
  toConfigurePackCommand
} from '@/compendiums';
import { parseRequest } from '@/core/shared';
import type { CompendiumHandlerDependencies } from './GetCompendiumInfoHandler';
import { toWirePackInfo } from './compendiumManagementWireMappers';

export function createConfigureCompendiumHandler(
  deps: CompendiumHandlerDependencies = {}
): (params: ConfigureCompendiumParams) => Promise<ConfigureCompendiumResult> {
  const service = createFoundryCompendiumManagementService(deps);

  return async function configureCompendiumHandler(
    params: ConfigureCompendiumParams
  ): Promise<ConfigureCompendiumResult> {
    const command = toConfigurePackCommand(parseRequest(configureCompendiumRequestSchema, params));
    return toWirePackInfo(await service.configure(command));
  };
}

export const configureCompendiumHandler = createConfigureCompendiumHandler();
