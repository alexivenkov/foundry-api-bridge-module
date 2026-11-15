import type { ShowCardParams, ShowCardResult } from '@/commands/types';
import { createFoundryCardOperationService, showCardRequestSchema, toShowCardCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';

export function createShowCardHandler(
  deps: CardHandlerDependencies = {}
): (params: ShowCardParams) => Promise<ShowCardResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function showCardHandler(params: ShowCardParams): Promise<ShowCardResult> {
    const result = await service.show(toShowCardCommand(parseRequest(showCardRequestSchema, params)));
    return { stackId: result.stackId, cardId: result.cardId, messageId: result.messageId };
  };
}

export const showCardHandler = createShowCardHandler();
