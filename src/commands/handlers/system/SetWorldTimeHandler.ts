import type { SetWorldTimeParams, SetWorldTimeResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryWorldTimeService, setWorldTimeSchemaFor, toSetWorldTimeCommand } from '@/core/world';
import { withWireDate } from './calendarWireMappers';
import type { RunningGameHandlerDependencies } from './GetWorldTimeHandler';

export function createSetWorldTimeHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: SetWorldTimeParams) => Promise<SetWorldTimeResult> {
  const service = createFoundryWorldTimeService(deps.gameProvider);

  return async function setWorldTimeHandler(params: SetWorldTimeParams): Promise<SetWorldTimeResult> {
    const command = toSetWorldTimeCommand(parseRequest(setWorldTimeSchemaFor(params), params));
    const reading = await service.setTime(command);
    return withWireDate({ worldTime: reading.worldTime }, reading.date);
  };
}

export const setWorldTimeHandler = createSetWorldTimeHandler();
