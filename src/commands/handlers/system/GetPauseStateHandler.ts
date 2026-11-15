import type { GetPauseStateParams, GetPauseStateResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryGamePauseService } from '@/core/world';
import type { RunningGameHandlerDependencies } from './GetWorldTimeHandler';

export function createGetPauseStateHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: GetPauseStateParams) => Promise<GetPauseStateResult> {
  const service = createFoundryGamePauseService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function getPauseStateHandler(_params: GetPauseStateParams): Promise<GetPauseStateResult> {
    try {
      return Promise.resolve({ paused: service.isPaused() });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getPauseStateHandler = createGetPauseStateHandler();
