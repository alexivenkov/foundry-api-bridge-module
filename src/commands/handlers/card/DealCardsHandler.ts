import type { CardOperationResult, DealCardsParams } from '@/commands/types';
import { createFoundryCardOperationService, dealCardsRequestSchema, toDealCardsCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardOperation } from './cardWireMappers';

export function createDealCardsHandler(
  deps: CardHandlerDependencies = {}
): (params: DealCardsParams) => Promise<CardOperationResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function dealCardsHandler(params: DealCardsParams): Promise<CardOperationResult> {
    const result = await service.deal(toDealCardsCommand(parseRequest(dealCardsRequestSchema, params)));
    return toWireCardOperation(result);
  };
}

export const dealCardsHandler = createDealCardsHandler();
