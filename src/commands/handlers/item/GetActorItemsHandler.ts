import type { ActorItemsResult, GetActorItemsParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import {
  createFoundryActorItemService,
  getActorItemsRequestSchema,
  getTokenActorItemsRequestSchema,
  parseActorItemRequest,
  toListActorItemsQuery
} from '@/core/items';
import { toWireActorItems, type ItemHandlerDependencies } from './itemWireMappers';

export function createGetActorItemsHandler(
  deps: ItemHandlerDependencies = {}
): (params: GetActorItemsParams) => Promise<ActorItemsResult> {
  const service = createFoundryActorItemService(deps.gameProvider);

  return function getActorItemsHandler(params: GetActorItemsParams): Promise<ActorItemsResult> {
    try {
      const query = toListActorItemsQuery(
        parseActorItemRequest(getActorItemsRequestSchema, getTokenActorItemsRequestSchema, params)
      );
      return Promise.resolve(toWireActorItems(service.listItems(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getActorItemsHandler = createGetActorItemsHandler();
