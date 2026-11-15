import type { AdvanceTimeCommand, SetWorldTimeCommand, TimeDifferenceQuery } from '@/core/world/application';
import type { CalendarDateInput, TimePoint } from '@/core/world/domain';
import { ValidationError } from '@/kernel';
import type {
  AdvanceTimeRequest,
  CalendarDateRequest,
  GetTimeDifferenceRequest,
  SetWorldTimeRequest
} from './worldSchemas';

function toCalendarDateInput(date: CalendarDateRequest): CalendarDateInput {
  return { year: date.year, month: date.month, day: date.day, hour: date.hour, minute: date.minute, second: date.second };
}

export function toAdvanceTimeCommand(request: AdvanceTimeRequest): AdvanceTimeCommand {
  if ('duration' in request) {
    const { days, hours, minutes, seconds } = request.duration;
    return { duration: { days, hours, minutes, seconds } };
  }
  return { seconds: request.seconds };
}

export function toSetWorldTimeCommand(request: SetWorldTimeRequest): SetWorldTimeCommand {
  if ('date' in request) {
    return { date: toCalendarDateInput(request.date) };
  }
  return { worldTime: request.worldTime };
}

function toTimePoint(worldTime: number | undefined, date: CalendarDateRequest | undefined): TimePoint | undefined {
  if (date !== undefined) {
    return { date: toCalendarDateInput(date) };
  }
  return worldTime !== undefined ? { worldTime } : undefined;
}

export function toTimeDifferenceQuery(request: GetTimeDifferenceRequest): TimeDifferenceQuery {
  const to = toTimePoint(request.toWorldTime, request.toDate);
  if (to === undefined) {
    throw new ValidationError('toDate: give exactly one of toWorldTime and toDate');
  }
  return { from: toTimePoint(request.fromWorldTime, request.fromDate), to };
}
