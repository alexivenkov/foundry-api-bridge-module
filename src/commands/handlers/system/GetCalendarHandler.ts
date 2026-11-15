import type { GetCalendarParams, GetCalendarResult } from '@/commands/types';
import { createFoundryCalendarService } from '@/core/world';
import { toWireCalendarDate, toWireCalendarDefinition } from './calendarWireMappers';
import type { RunningGameHandlerDependencies } from './GetWorldTimeHandler';

export function createGetCalendarHandler(
  deps: RunningGameHandlerDependencies = {}
): (params: GetCalendarParams) => Promise<GetCalendarResult> {
  const service = createFoundryCalendarService(deps.gameProvider);

  // The command takes no parameters, so there is nothing to validate.
  return function getCalendarHandler(_params: GetCalendarParams): Promise<GetCalendarResult> {
    try {
      const overview = service.getCalendar();
      return Promise.resolve({
        calendar: toWireCalendarDefinition(overview.definition),
        now: toWireCalendarDate(overview.now)
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getCalendarHandler = createGetCalendarHandler();
