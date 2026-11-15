import type { DeleteCardStackParams, DeleteCardStackResult } from '@/commands/types';
import { createFoundryCardStackService, deleteCardStackRequestSchema, toDeleteCardStackCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardMove } from './cardWireMappers';

export function createDeleteCardStackHandler(
  deps: CardHandlerDependencies = {}
): (params: DeleteCardStackParams) => Promise<DeleteCardStackResult> {
  const service = createFoundryCardStackService(deps.globals);

  return async function deleteCardStackHandler(params: DeleteCardStackParams): Promise<DeleteCardStackResult> {
    const command = toDeleteCardStackCommand(parseRequest(deleteCardStackRequestSchema, params));
    const result = await service.deleteStack(command);
    return { deleted: true, stackId: result.stackId, moved: result.moved.map(toWireCardMove) };
  };
}

export const deleteCardStackHandler = createDeleteCardStackHandler();
