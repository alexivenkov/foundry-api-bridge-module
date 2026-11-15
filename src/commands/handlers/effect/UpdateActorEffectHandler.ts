import type { UpdateActorEffectParams, UpdateEffectResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import {
  createFoundryEffectService,
  toUpdateEffectCommand,
  updateActorEffectRequestSchema
} from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireEffectUpdate, type EffectHandlerDependencies } from './effectWireMappers';

export function createUpdateActorEffectHandler(
  deps: EffectHandlerDependencies = {}
): (params: UpdateActorEffectParams) => Promise<UpdateEffectResult> {
  const service = createFoundryEffectService(deps.gameProvider, deps);

  return async function updateActorEffectHandler(params: UpdateActorEffectParams): Promise<UpdateEffectResult> {
    const command = toUpdateEffectCommand(parseRequest(updateActorEffectRequestSchema, params));
    try {
      return toWireEffectUpdate(await service.updateEffect(command), command.effectId);
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const updateActorEffectHandler = createUpdateActorEffectHandler();
