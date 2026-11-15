import type { CreateCardStackParams, CreateCardStackResult } from '@/commands/types';
import { createCardStackRequestSchema, createFoundryCardStackService, toCreateCardStackCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardStack } from './cardWireMappers';

export function createCreateCardStackHandler(
  deps: CardHandlerDependencies = {}
): (params: CreateCardStackParams) => Promise<CreateCardStackResult> {
  const service = createFoundryCardStackService(deps.globals);

  return async function createCardStackHandler(params: CreateCardStackParams): Promise<CreateCardStackResult> {
    const command = toCreateCardStackCommand(parseRequest(createCardStackRequestSchema, params));
    const result = await service.createStack(command);
    return toWireCardStack(result);
  };
}

export const createCardStackHandler = createCreateCardStackHandler();
