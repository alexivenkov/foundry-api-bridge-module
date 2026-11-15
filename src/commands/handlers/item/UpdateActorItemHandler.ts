import type { ItemResult, UpdateActorItemParams } from '@/commands/types';
import {
  createFoundryActorItemService,
  parseActorItemRequest,
  toUpdateActorItemCommand,
  updateActorItemRequestSchema,
  updateTokenActorItemRequestSchema
} from '@/core/items';
import { toWireItemResult, type ItemHandlerDependencies } from './itemWireMappers';

export function createUpdateActorItemHandler(
  deps: ItemHandlerDependencies = {}
): (params: UpdateActorItemParams) => Promise<ItemResult> {
  const service = createFoundryActorItemService(deps.gameProvider, deps);

  return async function updateActorItemHandler(params: UpdateActorItemParams): Promise<ItemResult> {
    const command = toUpdateActorItemCommand(
      parseActorItemRequest(updateActorItemRequestSchema, updateTokenActorItemRequestSchema, params)
    );
    return toWireItemResult(await service.updateItem(command));
  };
}

export const updateActorItemHandler = createUpdateActorItemHandler();
