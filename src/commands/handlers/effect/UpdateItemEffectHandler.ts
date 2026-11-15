import type { ItemEffectResult, UpdateItemEffectParams } from '@/commands/types';
import {
  createFoundryEffectDetailsService,
  toUpdateItemEffectCommand,
  updateItemEffectRequestSchema
} from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireItemEffect, type EffectHandlerDependencies } from './effectWireMappers';

export function createUpdateItemEffectHandler(
  deps: EffectHandlerDependencies = {}
): (params: UpdateItemEffectParams) => Promise<ItemEffectResult> {
  const service = createFoundryEffectDetailsService(deps.gameProvider, deps);

  return async function updateItemEffectHandler(params: UpdateItemEffectParams): Promise<ItemEffectResult> {
    const command = toUpdateItemEffectCommand(parseRequest(updateItemEffectRequestSchema, params));
    return toWireItemEffect(await service.updateItemEffect(command));
  };
}

export const updateItemEffectHandler = createUpdateItemEffectHandler();
