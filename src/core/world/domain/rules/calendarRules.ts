import { CalendarDateNotFoundError, InvalidCalendarDateError } from '@/core/world/domain/errors/calendarErrors';
import type {
  CalendarComponents,
  CalendarDate,
  CalendarDateInput,
  CalendarDefinition,
  CalendarDuration,
  DurationBreakdown
} from '@/core/world/domain/model/Calendar';
import type { WorldCalendar } from '@/core/world/domain/ports/WorldCalendar';

interface UnitSeconds {
  readonly minute: number;
  readonly hour: number;
  readonly day: number;
}

function unitSeconds(definition: CalendarDefinition): UnitSeconds {
  const minute = definition.secondsPerMinute;
  const hour = minute * definition.minutesPerHour;
  return { minute, hour, day: hour * definition.hoursPerDay };
}

export function durationToSeconds(definition: CalendarDefinition, duration: CalendarDuration): number {
  const units = unitSeconds(definition);
  return (
    (duration.days ?? 0) * units.day +
    (duration.hours ?? 0) * units.hour +
    (duration.minutes ?? 0) * units.minute +
    (duration.seconds ?? 0)
  );
}

/** The absolute length of a span in whole days, hours and minutes of the calendar, and the seconds left over. */
export function breakDownSeconds(definition: CalendarDefinition, seconds: number): DurationBreakdown {
  const units = unitSeconds(definition);
  let rest = Math.abs(seconds);
  const days = Math.floor(rest / units.day);
  rest -= days * units.day;
  const hours = Math.floor(rest / units.hour);
  rest -= hours * units.hour;
  const minutes = Math.floor(rest / units.minute);
  rest -= minutes * units.minute;
  return { days, hours, minutes, seconds: rest };
}

export function describeDate(
  definition: CalendarDefinition,
  worldTime: number,
  components: CalendarComponents,
  formatted: string
): CalendarDate {
  const season = components.season === null ? null : (definition.seasons[components.season]?.name ?? null);
  return {
    worldTime,
    year: components.year,
    month: components.month + 1,
    monthName: definition.months[components.month]?.name ?? '',
    day: components.dayOfMonth + 1,
    dayOfYear: components.dayOfYear + 1,
    weekday: definition.weekdays[components.weekday]?.name ?? '',
    hour: components.hour,
    minute: components.minute,
    second: components.second,
    season,
    leapYear: components.leapYear,
    formatted
  };
}

function requireBelow(name: string, value: number, limit: number): void {
  if (value < 0 || value >= limit) {
    throw new InvalidCalendarDateError(`${name} must be from 0 to ${String(limit - 1)}`);
  }
}

/** Checks a date against the calendar's units; whether the day exists in that very year is left to the lookup. */
export function assertDateFits(definition: CalendarDefinition, date: CalendarDateInput): void {
  if (date.year < 0) {
    throw new InvalidCalendarDateError('year must not be negative');
  }
  const monthCount = definition.months.length;
  if (monthCount === 0) {
    throw new InvalidCalendarDateError('the calendar has no months');
  }
  if (date.month < 1 || date.month > monthCount) {
    throw new InvalidCalendarDateError(`month must be from 1 to ${String(monthCount)}`);
  }
  const month = definition.months[date.month - 1];
  const longest = Math.max(month?.days ?? 0, month?.leapDays ?? 0);
  if (date.day < 1 || date.day > longest) {
    throw new InvalidCalendarDateError(`day must be from 1 to ${String(longest)} in month ${String(date.month)}`);
  }
  requireBelow('hour', date.hour ?? 0, definition.hoursPerDay);
  requireBelow('minute', date.minute ?? 0, definition.minutesPerHour);
  requireBelow('second', date.second ?? 0, definition.secondsPerMinute);
}

type DateKey = readonly [number, number, number];

function compareKeys(a: DateKey, b: DateKey): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function longestYear(definition: CalendarDefinition): number {
  const regular = definition.months.reduce((sum, month) => sum + month.days, 0);
  const leap = definition.months.reduce((sum, month) => sum + (month.leapDays ?? month.days), 0);
  return Math.max(definition.daysPerYear, regular, leap);
}

/**
 * The world time of a calendar date, found through the core's own
 * decomposition — the one every screen shows — rather than its inverse: the
 * two disagree around leap years in Foundry 13 and 14. The day is searched
 * within two years of the core's estimate; a day the calendar skips in that
 * year is refused.
 */
export function resolveCalendarDate(
  definition: CalendarDefinition,
  date: CalendarDateInput,
  calendar: Pick<WorldCalendar, 'decompose' | 'startOfYear'>
): number {
  assertDateFits(definition, date);
  const units = unitSeconds(definition);
  const target: DateKey = [date.year, date.month - 1, date.day - 1];
  const keyOf = (day: number): DateKey => {
    const components = calendar.decompose(day * units.day);
    return [components.year, components.month, components.dayOfMonth];
  };

  const daysBefore = definition.months.slice(0, date.month - 1).reduce((sum, month) => sum + month.days, 0);
  const estimate = Math.floor(calendar.startOfYear(date.year) / units.day) + daysBefore + date.day - 1;
  const span = 2 * longestYear(definition) + 2;
  let low = Math.max(0, estimate - span);
  let high = Math.max(low, estimate + span);
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (compareKeys(keyOf(middle), target) < 0) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  if (compareKeys(keyOf(low), target) !== 0) {
    throw new CalendarDateNotFoundError(date.year, date.month, date.day);
  }
  return low * units.day + (date.hour ?? 0) * units.hour + (date.minute ?? 0) * units.minute + (date.second ?? 0);
}
