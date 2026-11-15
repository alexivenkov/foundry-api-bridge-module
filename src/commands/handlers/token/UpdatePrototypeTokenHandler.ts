import type { UpdatePrototypeTokenParams, UpdatePrototypeTokenResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenAppearanceService,
  toUpdatePrototypeTokenCommand,
  updatePrototypeTokenRequestSchema
} from '@/core/tokens';
import { toWirePrototype, type TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createUpdatePrototypeTokenHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: UpdatePrototypeTokenParams) => Promise<UpdatePrototypeTokenResult> {
  const service = createFoundryTokenAppearanceService(deps);

  return async function updatePrototypeTokenHandler(
    params: UpdatePrototypeTokenParams
  ): Promise<UpdatePrototypeTokenResult> {
    const command = toUpdatePrototypeTokenCommand(parseRequest(updatePrototypeTokenRequestSchema, params));
    return toWirePrototype(await service.updatePrototype(command));
  };
}

export const updatePrototypeTokenHandler = createUpdatePrototypeTokenHandler();
