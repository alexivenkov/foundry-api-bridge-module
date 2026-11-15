import type { PauseGameParams, PauseGameResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryGamePauseService } from '@/core/world';
import type { RunningGameHandlerDependencies } from './GetWorldTimeHandler';

export function createPauseGameHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: PauseGameParams) => Promise<PauseGameResult> {
  const service = createFoundryGamePauseService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function pauseGameHandler(_params: PauseGameParams): Promise<PauseGameResult> {
    try {
      service.pause();
      return Promise.resolve({ paused: true });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const pauseGameHandler = createPauseGameHandler();
