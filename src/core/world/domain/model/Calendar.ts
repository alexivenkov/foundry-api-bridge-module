// The world calendar of Foundry 13+ (`CalendarData`, `CONFIG.time.worldCalendarConfig`).

export interface CalendarMonth {
  readonly name: string;
  readonly abbreviation: string | null;
  readonly ordinal: number;
  readonly days: number;
  /** Null = the same as `days`. */
  readonly leapDays: number | null;
}

export interface CalendarWeekday {
  readonly name: string;
  readonly abbreviation: string | null;
  readonly ordinal: number;
}

/** A season spans either ordinal months or days of the year; the other pair is null. */
export interface CalendarSeason {
  readonly name: string;
  readonly abbreviation: string | null;
  readonly monthStart: number | null;
  readonly monthEnd: number | null;
  readonly dayStart: number | null;
  readonly dayEnd: number | null;
}

export interface CalendarLeapYear {
  readonly leapStart: number;
  readonly leapInterval: number;
}

export interface CalendarDefinition {
  readonly name: string;
  readonly description: string | null;
  readonly yearZero: number;
  readonly firstWeekday: number;
  readonly leapYear: CalendarLeapYear | null;
  readonly months: readonly CalendarMonth[];
  readonly weekdays: readonly CalendarWeekday[];
  readonly seasons: readonly CalendarSeason[];
  readonly daysPerYear: number;
  readonly hoursPerDay: number;
  readonly minutesPerHour: number;
  readonly secondsPerMinute: number;
}

/** The core's decomposition of a world time (`CalendarData#timeToComponents`); indexes are 0-based. */
export interface CalendarComponents {
  readonly year: number;
  readonly dayOfYear: number;
  readonly month: number;
  readonly dayOfMonth: number;
  readonly weekday: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly season: number | null;
  readonly leapYear: boolean;
}

/** A world time as a reader of the calendar sees it: month, day and day of year are 1-based. */
export interface CalendarDate {
  readonly worldTime: number;
  readonly year: number;
  readonly month: number;
  readonly monthName: string;
  readonly day: number;
  readonly dayOfYear: number;
  readonly weekday: string;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly season: string | null;
  readonly leapYear: boolean;
  readonly formatted: string;
}

/** A date to look up on the calendar: `month` and `day` are 1-based, omitted time parts are 0. */
export interface CalendarDateInput {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour?: number | undefined;
  readonly minute?: number | undefined;
  readonly second?: number | undefined;
}

export interface CalendarDuration {
  readonly days?: number | undefined;
  readonly hours?: number | undefined;
  readonly minutes?: number | undefined;
  readonly seconds?: number | undefined;
}

export interface DurationBreakdown {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

/** One end of a time span: a world time or a calendar date. */
export type TimePoint = { readonly worldTime: number } | { readonly date: CalendarDateInput };
