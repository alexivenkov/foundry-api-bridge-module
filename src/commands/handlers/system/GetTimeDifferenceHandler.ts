import type { GetTimeDifferenceParams, GetTimeDifferenceResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryCalendarService, getTimeDifferenceRequestSchema, toTimeDifferenceQuery } from '@/core/world';
import { toWireCalendarDate, toWireDuration } from './calendarWireMappers';
import type { RunningGameHandlerDependencies } from './GetWorldTimeHandler';

export function createGetTimeDifferenceHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: GetTimeDifferenceParams) => Promise<GetTimeDifferenceResult> {
  const service = createFoundryCalendarService(deps.gameProvider);

  return function getTimeDifferenceHandler(params: GetTimeDifferenceParams): Promise<GetTimeDifferenceResult> {
    try {
      const difference = service.difference(
        toTimeDifferenceQuery(parseRequest(getTimeDifferenceRequestSchema, params))
      );
      return Promise.resolve({
        from: toWireCalendarDate(difference.from),
        to: toWireCalendarDate(difference.to),
        seconds: difference.seconds,
        duration: toWireDuration(difference.duration)
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getTimeDifferenceHandler = createGetTimeDifferenceHandler();
