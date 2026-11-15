import type { CardOperationResult, DrawCardsParams } from '@/commands/types';
import { createFoundryCardOperationService, drawCardsRequestSchema, toDrawCardsCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardOperation } from './cardWireMappers';

export function createDrawCardsHandler(
  deps: CardHandlerDependencies = {}
): (params: DrawCardsParams) => Promise<CardOperationResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function drawCardsHandler(params: DrawCardsParams): Promise<CardOperationResult> {
    const result = await service.draw(toDrawCardsCommand(parseRequest(drawCardsRequestSchema, params)));
    return toWireCardOperation(result);
  };
}

export const drawCardsHandler = createDrawCardsHandler();
