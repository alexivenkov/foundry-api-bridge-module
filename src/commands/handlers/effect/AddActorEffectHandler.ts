import type { AddActorEffectParams, AddEffectResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { addActorEffectRequestSchema, createFoundryEffectService, toAddEffectCommand } from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireEffectWrite, type EffectHandlerDependencies } from './effectWireMappers';

export function createAddActorEffectHandler(
  deps: EffectHandlerDependencies = {}
): (params: AddActorEffectParams) => Promise<AddEffectResult> {
  const service = createFoundryEffectService(deps.gameProvider, deps);

  return async function addActorEffectHandler(params: AddActorEffectParams): Promise<AddEffectResult> {
    const command = toAddEffectCommand(parseRequest(addActorEffectRequestSchema, params));
    try {
      return toWireEffectWrite(await service.addEffect(command));
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const addActorEffectHandler = createAddActorEffectHandler();
