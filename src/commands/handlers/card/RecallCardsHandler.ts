import type { CardOperationResult, RecallCardsParams } from '@/commands/types';
import { createFoundryCardOperationService, recallCardsRequestSchema, toRecallCardsCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardOperation } from './cardWireMappers';

export function createRecallCardsHandler(
  deps: CardHandlerDependencies = {}
): (params: RecallCardsParams) => Promise<CardOperationResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function recallCardsHandler(params: RecallCardsParams): Promise<CardOperationResult> {
    const result = await service.recall(toRecallCardsCommand(parseRequest(recallCardsRequestSchema, params)));
    return toWireCardOperation(result);
  };
}

export const recallCardsHandler = createRecallCardsHandler();
