import type { UpdateCardStackParams, UpdateCardStackResult } from '@/commands/types';
import { createFoundryCardStackService, toUpdateCardStackCommand, updateCardStackRequestSchema } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardStack } from './cardWireMappers';

export function createUpdateCardStackHandler(
  deps: CardHandlerDependencies = {}
): (params: UpdateCardStackParams) => Promise<UpdateCardStackResult> {
  const service = createFoundryCardStackService(deps.globals);

  return async function updateCardStackHandler(params: UpdateCardStackParams): Promise<UpdateCardStackResult> {
    const command = toUpdateCardStackCommand(parseRequest(updateCardStackRequestSchema, params));
    const result = await service.updateStack(command);
    return toWireCardStack(result);
  };
}

export const updateCardStackHandler = createUpdateCardStackHandler();
