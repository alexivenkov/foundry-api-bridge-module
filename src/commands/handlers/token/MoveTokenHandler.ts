import type { MoveTokenParams, TokenResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenMovementService,
  moveTokenRequestSchema,
  toMoveTokenCommand,
  type TokenMovementWiring
} from '@/core/tokens';
import { toWireMovementResult } from './tokenWireMappers';

export function createMoveTokenHandler(
  wiring: TokenMovementWiring = {}
): (params: MoveTokenParams) => Promise<TokenResult> {
  const service = createFoundryTokenMovementService(wiring);

  return async function moveTokenHandler(params: MoveTokenParams): Promise<TokenResult> {
    const command = toMoveTokenCommand(parseRequest(moveTokenRequestSchema, params));
    try {
      return toWireMovementResult(await service.moveToken(command));
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const moveTokenHandler = createMoveTokenHandler();
