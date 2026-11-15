import type { CardOperationResult, ShuffleCardsParams } from '@/commands/types';
import { createFoundryCardOperationService, shuffleCardsRequestSchema, toShuffleCardsCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardOperation } from './cardWireMappers';

export function createShuffleCardsHandler(
  deps: CardHandlerDependencies = {}
): (params: ShuffleCardsParams) => Promise<CardOperationResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function shuffleCardsHandler(params: ShuffleCardsParams): Promise<CardOperationResult> {
    const result = await service.shuffle(toShuffleCardsCommand(parseRequest(shuffleCardsRequestSchema, params)));
    return toWireCardOperation(result);
  };
}

export const shuffleCardsHandler = createShuffleCardsHandler();
