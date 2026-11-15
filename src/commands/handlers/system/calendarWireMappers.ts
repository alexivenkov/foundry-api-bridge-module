import type {
  CalendarDate as WireCalendarDate,
  CalendarDefinitionInfo,
  CalendarDurationBreakdown
} from '@/commands/types';
import type { CalendarDate, CalendarDefinition, DurationBreakdown } from '@/core/world';

export function toWireCalendarDate(date: CalendarDate): WireCalendarDate {
  return {
    worldTime: date.worldTime,
    year: date.year,
    month: date.month,
    monthName: date.monthName,
    day: date.day,
    dayOfYear: date.dayOfYear,
    weekday: date.weekday,
    hour: date.hour,
    minute: date.minute,
    second: date.second,
    season: date.season,
    leapYear: date.leapYear,
    formatted: date.formatted
  };
}

/** The date exists only on cores with a calendar; elsewhere the key is left out. */
export function withWireDate<T extends object>(result: T, date: CalendarDate | undefined): T & { date?: WireCalendarDate } {
  return date === undefined ? result : { ...result, date: toWireCalendarDate(date) };
}

export function toWireCalendarDefinition(definition: CalendarDefinition): CalendarDefinitionInfo {
  return {
    name: definition.name,
    description: definition.description,
    yearZero: definition.yearZero,
    firstWeekday: definition.firstWeekday,
    leapYear:
      definition.leapYear === null
        ? null
        : { leapStart: definition.leapYear.leapStart, leapInterval: definition.leapYear.leapInterval },
    months: definition.months.map((month) => ({
      name: month.name,
      abbreviation: month.abbreviation,
      ordinal: month.ordinal,
      days: month.days,
      leapDays: month.leapDays
    })),
    weekdays: definition.weekdays.map((day) => ({ name: day.name, abbreviation: day.abbreviation, ordinal: day.ordinal })),
    seasons: definition.seasons.map((season) => ({
      name: season.name,
      abbreviation: season.abbreviation,
      monthStart: season.monthStart,
      monthEnd: season.monthEnd,
      dayStart: season.dayStart,
      dayEnd: season.dayEnd
    })),
    daysPerYear: definition.daysPerYear,
    hoursPerDay: definition.hoursPerDay,
    minutesPerHour: definition.minutesPerHour,
    secondsPerMinute: definition.secondsPerMinute
  };
}

export function toWireDuration(duration: DurationBreakdown): CalendarDurationBreakdown {
  return { days: duration.days, hours: duration.hours, minutes: duration.minutes, seconds: duration.seconds };
}
