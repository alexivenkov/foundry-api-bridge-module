import type { GetPrototypeTokenParams, GetPrototypeTokenResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenAppearanceService, getPrototypeTokenRequestSchema, toPrototypeTokenQuery } from '@/core/tokens';
import { toWirePrototype, type TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createGetPrototypeTokenHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: GetPrototypeTokenParams) => Promise<GetPrototypeTokenResult> {
  const service = createFoundryTokenAppearanceService(deps);

  return function getPrototypeTokenHandler(params: GetPrototypeTokenParams): Promise<GetPrototypeTokenResult> {
    try {
      const query = toPrototypeTokenQuery(parseRequest(getPrototypeTokenRequestSchema, params));
      return Promise.resolve(toWirePrototype(service.getPrototype(query)));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getPrototypeTokenHandler = createGetPrototypeTokenHandler();
