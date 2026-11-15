import type { RemoveActorEffectParams, RemoveEffectResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import {
  createFoundryEffectService,
  removeActorEffectRequestSchema,
  toRemoveEffectCommand
} from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireEffectRemoval, type EffectHandlerDependencies } from './effectWireMappers';

export function createRemoveActorEffectHandler(
  deps: EffectHandlerDependencies = {}
): (params: RemoveActorEffectParams) => Promise<RemoveEffectResult> {
  const service = createFoundryEffectService(deps.gameProvider, deps);

  return async function removeActorEffectHandler(params: RemoveActorEffectParams): Promise<RemoveEffectResult> {
    const command = toRemoveEffectCommand(parseRequest(removeActorEffectRequestSchema, params));
    try {
      return toWireEffectRemoval(await service.removeEffect(command));
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const removeActorEffectHandler = createRemoveActorEffectHandler();
