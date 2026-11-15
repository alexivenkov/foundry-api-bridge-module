import type { FlipCardParams, FlipCardResult } from '@/commands/types';
import { createFoundryCardOperationService, flipCardRequestSchema, toFlipCardCommand } from '@/core/cards';
import { parseRequest } from '@/core/shared';
import type { CardHandlerDependencies } from './GetCardStacksHandler';
import { toWireCardResult } from './cardWireMappers';

export function createFlipCardHandler(
  deps: CardHandlerDependencies = {}
): (params: FlipCardParams) => Promise<FlipCardResult> {
  const service = createFoundryCardOperationService(deps.globals);

  return async function flipCardHandler(params: FlipCardParams): Promise<FlipCardResult> {
    const result = await service.flip(toFlipCardCommand(parseRequest(flipCardRequestSchema, params)));
    return toWireCardResult(result);
  };
}

export const flipCardHandler = createFlipCardHandler();
