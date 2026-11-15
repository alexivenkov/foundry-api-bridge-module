import type { GetWorldTimeParams, GetWorldTimeResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { createFoundryWorldTimeService, type RunningGameProvider } from '@/core/world';
import { withWireDate } from './calendarWireMappers';

export interface RunningGameHandlerDependencies {
  gameProvider?: RunningGameProvider;
}

export function createGetWorldTimeHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: GetWorldTimeParams) => Promise<GetWorldTimeResult> {
  const service = createFoundryWorldTimeService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function getWorldTimeHandler(_params: GetWorldTimeParams): Promise<GetWorldTimeResult> {
    try {
      const reading = service.readTime();
      return Promise.resolve(withWireDate({ worldTime: reading.worldTime }, reading.date));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getWorldTimeHandler = createGetWorldTimeHandler();
