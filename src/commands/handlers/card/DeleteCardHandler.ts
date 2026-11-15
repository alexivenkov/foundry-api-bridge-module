import type { DeleteCardParams, DeleteCardResult } from '@/commands/types';
import { createFoundryCardStackService, deleteCardRequestSchema, toDeleteCardCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';

export function createDeleteCardHandler(
  deps: CardHandlerDependencies = {}
): (params: DeleteCardParams) => Promise<DeleteCardResult> {
  const service = createFoundryCardStackService(deps.globals);

  return async function deleteCardHandler(params: DeleteCardParams): Promise<DeleteCardResult> {
    const result = await service.deleteCard(toDeleteCardCommand(parseRequest(deleteCardRequestSchema, params)));
    return { deleted: true, stackId: result.stackId, cardId: result.cardId };
  };
}

export const deleteCardHandler = createDeleteCardHandler();
