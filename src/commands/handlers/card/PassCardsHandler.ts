import type { CardOperationResult, PassCardsParams } from '@/commands/types';
import { createFoundryCardOperationService, passCardsRequestSchema, toPassCardsCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardOperation } from './cardWireMappers';

export function createPassCardsHandler(
  deps: CardHandlerDependencies = {}
): (params: PassCardsParams) => Promise<CardOperationResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function passCardsHandler(params: PassCardsParams): Promise<CardOperationResult> {
    const result = await service.pass(toPassCardsCommand(parseRequest(passCardsRequestSchema, params)));
    return toWireCardOperation(result);
  };
}

export const passCardsHandler = createPassCardsHandler();
