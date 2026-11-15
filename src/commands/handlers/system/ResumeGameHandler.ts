import type { ResumeGameParams, ResumeGameResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryGamePauseService } from '@/core/world';
import type { RunningGameHandlerDependencies } from './GetWorldTimeHandler';

export function createResumeGameHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: ResumeGameParams) => Promise<ResumeGameResult> {
  const service = createFoundryGamePauseService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function resumeGameHandler(_params: ResumeGameParams): Promise<ResumeGameResult> {
    try {
      service.resume();
      return Promise.resolve({ paused: false });
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const resumeGameHandler = createResumeGameHandler();
