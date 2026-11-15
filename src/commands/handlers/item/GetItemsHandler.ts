import type { GetItemsParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryWorldItemService } from '@/core/items';
import type { ItemData } from '@/types/foundry';
import { toWireItemData, type ItemHandlerDependencies } from './itemWireMappers';

export function createGetItemsHandler(
  deps: ItemHandlerDependencies = {}
): (params: GetItemsParams) => Promise<ItemData[]> {
  const service = createFoundryWorldItemService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function getItemsHandler(_params: GetItemsParams): Promise<ItemData[]> {
    try {
      return Promise.resolve(service.listItems().map(toWireItemData));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getItemsHandler = createGetItemsHandler();
