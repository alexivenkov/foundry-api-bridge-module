import type { CreateTokenParams, TokenResult } from '@/commands/types';
import { withShortNoActiveScene } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenAppearanceService,
  createTokenRequestSchema,
  toCreateTokenWithAppearanceCommand
} from '@/core/tokens';
import { toWireTokenResult, withWireAppearance, type TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createCreateTokenHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: CreateTokenParams) => Promise<TokenResult> {
  const service = createFoundryTokenAppearanceService(deps);

  return async function createTokenHandler(params: CreateTokenParams): Promise<TokenResult> {
    const command = toCreateTokenWithAppearanceCommand(parseRequest(createTokenRequestSchema, params));
    try {
      const { token, appearance } = await service.createToken(command);
      return withWireAppearance(toWireTokenResult(token), appearance);
    } catch (error) {
      throw withShortNoActiveScene(error);
    }
  };
}

export const createTokenHandler = createCreateTokenHandler();
