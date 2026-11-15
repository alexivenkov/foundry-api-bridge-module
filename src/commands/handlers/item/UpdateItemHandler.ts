import type { UpdateItemParams, WorldItemResult } from '@/commands/types';
import { createFoundryWorldItemService, toUpdateItemCommand, updateItemRequestSchema } from '@/core/items';
import { parseRequest } from '@/core/shared';
import { toWireWorldItemResult, type ItemHandlerDependencies } from './itemWireMappers';

export function createUpdateItemHandler(
  deps: ItemHandlerDependencies = {}
): (params: UpdateItemParams) => Promise<WorldItemResult> {
  const service = createFoundryWorldItemService(deps.gameProvider, deps);

  return async function updateItemHandler(params: UpdateItemParams): Promise<WorldItemResult> {
    const command = toUpdateItemCommand(parseRequest(updateItemRequestSchema, params));
    return toWireWorldItemResult(await service.updateItem(command));
  };
}

export const updateItemHandler = createUpdateItemHandler();
