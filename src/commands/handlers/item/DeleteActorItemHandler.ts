import type { DeleteActorItemParams, DeleteResult } from '@/commands/types';
import {
  createFoundryActorItemService,
  deleteActorItemRequestSchema,
  deleteTokenActorItemRequestSchema,
  parseActorItemRequest,
  toRemoveActorItemCommand
} from '@/core/items';
import type { ItemHandlerDependencies } from './itemWireMappers';

export function createDeleteActorItemHandler(
  deps: ItemHandlerDependencies = {}
): (params: DeleteActorItemParams) => Promise<DeleteResult> {
  const service = createFoundryActorItemService(deps.gameProvider);

  return async function deleteActorItemHandler(params: DeleteActorItemParams): Promise<DeleteResult> {
    await service.removeItem(toRemoveActorItemCommand(
      parseActorItemRequest(deleteActorItemRequestSchema, deleteTokenActorItemRequestSchema, params)
    ));
    return { deleted: true };
  };
}

export const deleteActorItemHandler = createDeleteActorItemHandler();
