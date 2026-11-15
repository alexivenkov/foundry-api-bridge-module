import type { CardOperationResult, PlayCardParams } from '@/commands/types';
import { createFoundryCardOperationService, playCardRequestSchema, toPlayCardCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardOperation } from './cardWireMappers';

export function createPlayCardHandler(
  deps: CardHandlerDependencies = {}
): (params: PlayCardParams) => Promise<CardOperationResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function playCardHandler(params: PlayCardParams): Promise<CardOperationResult> {
    const result = await service.play(toPlayCardCommand(parseRequest(playCardRequestSchema, params)));
    return toWireCardOperation(result);
  };
}

export const playCardHandler = createPlayCardHandler();
