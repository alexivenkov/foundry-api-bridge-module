import type { SetTokenTargetParams, SetTokenTargetResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenTargetingService,
  setTokenTargetRequestSchema,
  toSetTokenTargetCommand,
  type TargetingGlobalsProvider
} from '@/core/tokens';

export interface TokenTargetingHandlerDependencies {
  globals?: TargetingGlobalsProvider;
}

export function createSetTokenTargetHandler(
  deps: TokenTargetingHandlerDependencies = {}
): (params: SetTokenTargetParams) => Promise<SetTokenTargetResult> {
  const service = createFoundryTokenTargetingService(deps.globals);

  return function setTokenTargetHandler(params: SetTokenTargetParams): Promise<SetTokenTargetResult> {
    try {
      const command = toSetTokenTargetCommand(parseRequest(setTokenTargetRequestSchema, params));
      service.setTarget(command);
      return Promise.resolve({ tokenId: command.tokenId, targeted: command.targeted });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const setTokenTargetHandler = createSetTokenTargetHandler();
