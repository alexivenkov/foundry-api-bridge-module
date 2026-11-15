import type { AddItemToActorParams, ItemResult } from '@/commands/types';
import {
  addItemToActorRequestSchema,
  addItemToTokenActorRequestSchema,
  createFoundryActorItemService,
  parseActorItemRequest,
  toAddActorItemCommand
} from '@/core/items';
import { toWireItemResult, type ItemHandlerDependencies } from './itemWireMappers';

export function createAddItemToActorHandler(
  deps: ItemHandlerDependencies = {}
): (params: AddItemToActorParams) => Promise<ItemResult> {
  const service = createFoundryActorItemService(deps.gameProvider, deps);

  return async function addItemToActorHandler(params: AddItemToActorParams): Promise<ItemResult> {
    const command = toAddActorItemCommand(
      parseActorItemRequest(addItemToActorRequestSchema, addItemToTokenActorRequestSchema, params)
    );
    return toWireItemResult(await service.addItem(command));
  };
}

export const addItemToActorHandler = createAddItemToActorHandler();
