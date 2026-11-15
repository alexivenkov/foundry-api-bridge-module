import type { DeleteItemParams, DeleteItemResult } from '@/commands/types';
import { createFoundryWorldItemService, deleteItemRequestSchema, toDeleteItemCommand } from '@/core/items';
import { parseRequest } from '@/core/shared';
import type { ItemHandlerDependencies } from './itemWireMappers';

export function createDeleteItemHandler(
  deps: ItemHandlerDependencies = {}
): (params: DeleteItemParams) => Promise<DeleteItemResult> {
  const service = createFoundryWorldItemService(deps.gameProvider);

  return async function deleteItemHandler(params: DeleteItemParams): Promise<DeleteItemResult> {
    const command = toDeleteItemCommand(parseRequest(deleteItemRequestSchema, params));
    await service.deleteItem(command);
    return { deleted: true, itemId: command.itemId };
  };
}

export const deleteItemHandler = createDeleteItemHandler();
