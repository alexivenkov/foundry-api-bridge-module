import type { UpdateCardParams, UpdateCardResult } from '@/commands/types';
import { createFoundryCardStackService, toUpdateCardCommand, updateCardRequestSchema } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardResult } from './cardWireMappers';

export function createUpdateCardHandler(
  deps: CardHandlerDependencies = {}
): (params: UpdateCardParams) => Promise<UpdateCardResult> {
  const service = createFoundryCardStackService(deps.globals, deps);

  return async function updateCardHandler(params: UpdateCardParams): Promise<UpdateCardResult> {
    const result = await service.updateCard(toUpdateCardCommand(parseRequest(updateCardRequestSchema, params)));
    return toWireCardResult(result);
  };
}

export const updateCardHandler = createUpdateCardHandler();
