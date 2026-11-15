import type { AdvanceTimeParams, AdvanceTimeResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { advanceTimeSchemaFor, createFoundryWorldTimeService, toAdvanceTimeCommand } from '@/core/world';
import { withWireDate } from './calendarWireMappers';
import type { RunningGameHandlerDependencies } from './GetWorldTimeHandler';

export function createAdvanceTimeHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: AdvanceTimeParams) => Promise<AdvanceTimeResult> {
  const service = createFoundryWorldTimeService(deps.gameProvider);

  return async function advanceTimeHandler(params: AdvanceTimeParams): Promise<AdvanceTimeResult> {
    const command = toAdvanceTimeCommand(parseRequest(advanceTimeSchemaFor(params), params));
    const result = await service.advanceTime(command);
    return withWireDate({ worldTime: result.worldTime, advancedBy: result.advancedBy }, result.date);
  };
}

export const advanceTimeHandler = createAdvanceTimeHandler();
