import type { DeleteItemEffectParams, DeleteItemEffectResult } from '@/commands/types';
import {
  createFoundryEffectDetailsService,
  deleteItemEffectRequestSchema,
  toDeleteItemEffectCommand
} from '@/core/effects';
import { parseRequest } from '@/core/shared';
import { toWireItemEffectRemoval, type EffectHandlerDependencies } from './effectWireMappers';

export function createDeleteItemEffectHandler(
  deps: EffectHandlerDependencies = {}
): (params: DeleteItemEffectParams) => Promise<DeleteItemEffectResult> {
  const service = createFoundryEffectDetailsService(deps.gameProvider, deps);

  return async function deleteItemEffectHandler(params: DeleteItemEffectParams): Promise<DeleteItemEffectResult> {
    const command = toDeleteItemEffectCommand(parseRequest(deleteItemEffectRequestSchema, params));
    return toWireItemEffectRemoval(await service.deleteItemEffect(command));
  };
}

export const deleteItemEffectHandler = createDeleteItemEffectHandler();
