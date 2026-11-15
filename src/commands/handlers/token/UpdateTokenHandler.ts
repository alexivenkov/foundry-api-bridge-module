import type { UpdateTokenParams, TokenResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenAppearanceService,
  toUpdateTokenWithAppearanceCommand,
  updateTokenRequestSchema
} from '@/core/tokens';
import { toWireTokenResult, withWireAppearance, type TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createUpdateTokenHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: UpdateTokenParams) => Promise<TokenResult> {
  const service = createFoundryTokenAppearanceService(deps);

  return async function updateTokenHandler(params: UpdateTokenParams): Promise<TokenResult> {
    const command = toUpdateTokenWithAppearanceCommand(parseRequest(updateTokenRequestSchema, params));
    try {
      const { token, appearance } = await service.updateToken(command);
      return withWireAppearance(toWireTokenResult(token), appearance);
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const updateTokenHandler = createUpdateTokenHandler();
