import type { CreateItemEffectParams, ItemEffectResult } from '@/commands/types';
import {
  createFoundryEffectDetailsService,
  createItemEffectRequestSchema,
  toCreateItemEffectCommand
} from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireItemEffect, type EffectHandlerDependencies } from './effectWireMappers';

export function createCreateItemEffectHandler(
  deps: EffectHandlerDependencies = {}
): (params: CreateItemEffectParams) => Promise<ItemEffectResult> {
  const service = createFoundryEffectDetailsService(deps.gameProvider, deps);

  return async function createItemEffectHandler(params: CreateItemEffectParams): Promise<ItemEffectResult> {
    const command = toCreateItemEffectCommand(parseRequest(createItemEffectRequestSchema, params));
    return toWireItemEffect(await service.createItemEffect(command));
  };
}

export const createItemEffectHandler = createCreateItemEffectHandler();
