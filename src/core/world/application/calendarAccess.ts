import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  CALENDAR_UNAVAILABLE,
  describeDate,
  resolveCalendarDate,
  type CalendarDate,
  type TimePoint,
  type WorldCalendar
} from '@/core/world/domain';

export function hasCalendar(calendar: WorldCalendar | undefined): calendar is WorldCalendar {
  return calendar !== undefined && calendar.isAvailable();
}

export function requireCalendar(calendar: WorldCalendar | undefined): WorldCalendar {
  if (!hasCalendar(calendar)) {
    throw new CoreFeatureUnavailableError(CALENDAR_UNAVAILABLE);
  }
  return calendar;
}

export function dateOf(calendar: WorldCalendar, worldTime: number): CalendarDate {
  return describeDate(calendar.definition(), worldTime, calendar.decompose(worldTime), calendar.format(worldTime));
}

export function worldTimeOf(calendar: WorldCalendar, point: TimePoint): number {
  return 'date' in point ? resolveCalendarDate(calendar.definition(), point.date, calendar) : point.worldTime;
}
