import type { CardOperationResult, DiscardCardParams } from '@/commands/types';
import { createFoundryCardOperationService, discardCardRequestSchema, toPlayCardCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardOperation } from './cardWireMappers';

export function createDiscardCardHandler(
  deps: CardHandlerDependencies = {}
): (params: DiscardCardParams) => Promise<CardOperationResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function discardCardHandler(params: DiscardCardParams): Promise<CardOperationResult> {
    const result = await service.discard(toPlayCardCommand(parseRequest(discardCardRequestSchema, params)));
    return toWireCardOperation(result);
  };
}

export const discardCardHandler = createDiscardCardHandler();
