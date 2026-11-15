import type { GetWorldInfoParams, WorldInfoResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import {
  createFoundryWorldInfoService,
  createFoundryWorldSessionService,
  type WorldInfoGameProvider
} from '@/core/world';
import { toWireWorldInfo } from './worldInfoWireMapper';

export interface WorldInfoHandlerDependencies {
  gameProvider?: WorldInfoGameProvider;
}

export function createGetWorldInfoHandler(
  deps: WorldInfoHandlerDependencies = {}
): (params: GetWorldInfoParams) => Promise<WorldInfoResult> {
  const service = createFoundryWorldInfoService(deps.gameProvider);
  const session = createFoundryWorldSessionService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function getWorldInfoHandler(_params: GetWorldInfoParams): Promise<WorldInfoResult> {
    try {
      return Promise.resolve(toWireWorldInfo(service.getWorldInfo(), session.getSession()));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getWorldInfoHandler = createGetWorldInfoHandler();
