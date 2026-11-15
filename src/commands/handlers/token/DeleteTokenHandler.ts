import type { DeleteTokenParams, DeleteResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenService, deleteTokenRequestSchema, toDeleteTokenCommand } from '@/core/tokens';
import type { TokenHandlerDependencies } from './tokenWireMappers';

export function createDeleteTokenHandler(
  deps: TokenHandlerDependencies = {}
): (params: DeleteTokenParams) => Promise<DeleteResult> {
  const service = createFoundryTokenService(deps.gameProvider);

  return async function deleteTokenHandler(params: DeleteTokenParams): Promise<DeleteResult> {
    const command = toDeleteTokenCommand(parseRequest(deleteTokenRequestSchema, params));
    try {
      await service.deleteToken(command);
      return { deleted: true };
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const deleteTokenHandler = createDeleteTokenHandler();
