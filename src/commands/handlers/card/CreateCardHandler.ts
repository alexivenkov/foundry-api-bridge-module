import type { CreateCardParams, CreateCardResult } from '@/commands/types';
import { createCardRequestSchema, createFoundryCardStackService, toCreateCardCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardResult } from './cardWireMappers';

export function createCreateCardHandler(
  deps: CardHandlerDependencies = {}
): (params: CreateCardParams) => Promise<CreateCardResult> {
  const service = createFoundryCardStackService(deps.globals, deps);

  return async function createCardHandler(params: CreateCardParams): Promise<CreateCardResult> {
    const result = await service.createCard(toCreateCardCommand(parseRequest(createCardRequestSchema, params)));
    return toWireCardResult(result);
  };
}

export const createCardHandler = createCreateCardHandler();
