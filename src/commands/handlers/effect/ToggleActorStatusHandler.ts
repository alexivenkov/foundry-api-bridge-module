import type { ToggleActorStatusParams, ToggleStatusResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import {
  createFoundryEffectService,
  toToggleStatusCommand,
  toggleActorStatusRequestSchema
} from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireStatusToggle, type EffectHandlerDependencies } from './effectWireMappers';

export function createToggleActorStatusHandler(
  deps: EffectHandlerDependencies = {}
): (params: ToggleActorStatusParams) => Promise<ToggleStatusResult> {
  const service = createFoundryEffectService(deps.gameProvider, deps);

  return async function toggleActorStatusHandler(params: ToggleActorStatusParams): Promise<ToggleStatusResult> {
    const command = toToggleStatusCommand(parseRequest(toggleActorStatusRequestSchema, params));
    try {
      return toWireStatusToggle(await service.toggleStatus(command));
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const toggleActorStatusHandler = createToggleActorStatusHandler();
