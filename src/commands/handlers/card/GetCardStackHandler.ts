import type { GetCardStackParams, GetCardStackResult } from '@/commands/types';
import { createFoundryCardStackService, getCardStackRequestSchema, toGetCardStackQuery } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardStack } from './cardWireMappers';

export function createGetCardStackHandler(
  deps: CardHandlerDependencies = {}
): (params: GetCardStackParams) => Promise<GetCardStackResult> {
  const service = createFoundryCardStackService(deps.globals);

  return function getCardStackHandler(params: GetCardStackParams): Promise<GetCardStackResult> {
    try {
      const result = service.getStack(toGetCardStackQuery(parseRequest(getCardStackRequestSchema, params)));
      return Promise.resolve(toWireCardStack(result));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getCardStackHandler = createGetCardStackHandler();
