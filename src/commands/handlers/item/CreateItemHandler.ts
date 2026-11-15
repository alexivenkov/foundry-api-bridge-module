import type { CreateItemParams, WorldItemResult } from '@/commands/types';
import { createFoundryWorldItemService, createItemRequestSchema, toCreateItemCommand } from '@/core/items';
import { parseRequest } from '@/core/shared';
import { toWireWorldItemResult, type ItemHandlerDependencies } from './itemWireMappers';

export function createCreateItemHandler(
  deps: ItemHandlerDependencies = {}
): (params: CreateItemParams) => Promise<WorldItemResult> {
  const service = createFoundryWorldItemService(deps.gameProvider, deps);

  return async function createItemHandler(params: CreateItemParams): Promise<WorldItemResult> {
    const command = toCreateItemCommand(parseRequest(createItemRequestSchema, params));
    return toWireWorldItemResult(await service.createItem(command));
  };
}

export const createItemHandler = createCreateItemHandler();
