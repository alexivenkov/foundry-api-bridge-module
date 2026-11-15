import type { GetItemParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryWorldItemService, getItemRequestSchema, toGetItemQuery } from '@/core/items';
import { parseRequest } from '@/core/shared';
import type { ItemData } from '@/types/foundry';
import { toWireItemData, type ItemHandlerDependencies } from './itemWireMappers';

export function createGetItemHandler(
  deps: ItemHandlerDependencies = {}
): (params: GetItemParams) => Promise<ItemData> {
  const service = createFoundryWorldItemService(deps.gameProvider);

  return function getItemHandler(params: GetItemParams): Promise<ItemData> {
    try {
      const query = toGetItemQuery(parseRequest(getItemRequestSchema, params));
      return Promise.resolve(toWireItemData(service.getItem(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getItemHandler = createGetItemHandler();
