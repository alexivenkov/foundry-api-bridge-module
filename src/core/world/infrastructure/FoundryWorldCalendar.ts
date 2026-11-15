import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  CALENDAR_UNAVAILABLE,
  type CalendarComponents,
  type CalendarDefinition,
  type WorldCalendar
} from '@/core/world/domain';
import type { FoundryCalendar, FoundryRunningGame } from './foundryWorldTypes';
import type { RunningGameProvider } from './runningGame';

function optionalNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

function pad(value: number, width: number): string {
  return String(Math.trunc(value)).padStart(width, '0');
}

/**
 * Anti-corruption layer over `game.time.calendar` (`CalendarData`, Foundry
 * 13.351 and 14.368). Names in the calendar config are localization keys and
 * are localized here. Cores without a calendar (12 and older) report it as
 * unavailable.
 */
export class FoundryWorldCalendar implements WorldCalendar {
  constructor(private readonly gameProvider: RunningGameProvider) {}

  isAvailable(): boolean {
    const calendar = this.gameProvider.getGame().time.calendar;
    return typeof calendar?.timeToComponents === 'function' && typeof calendar.componentsToTime === 'function';
  }

  definition(): CalendarDefinition {
    const game = this.gameProvider.getGame();
    const calendar = this.calendar(game);
    const text = (key: string | null | undefined): string | null => {
      if (typeof key !== 'string' || key === '') {
        return null;
      }
      return game.i18n?.localize(key) ?? key;
    };
    const leapYear = calendar.years.leapYear;
    return {
      name: text(calendar.name) ?? '',
      description: text(calendar.description),
      yearZero: calendar.years.yearZero,
      firstWeekday: calendar.years.firstWeekday,
      leapYear: leapYear ? { leapStart: leapYear.leapStart, leapInterval: leapYear.leapInterval } : null,
      months: (calendar.months?.values ?? []).map((month) => ({
        name: text(month.name) ?? '',
        abbreviation: text(month.abbreviation),
        ordinal: month.ordinal,
        days: month.days,
        leapDays: optionalNumber(month.leapDays)
      })),
      weekdays: calendar.days.values.map((day) => ({
        name: text(day.name) ?? '',
        abbreviation: text(day.abbreviation),
        ordinal: day.ordinal
      })),
      seasons: (calendar.seasons?.values ?? []).map((season) => ({
        name: text(season.name) ?? '',
        abbreviation: text(season.abbreviation),
        monthStart: optionalNumber(season.monthStart),
        monthEnd: optionalNumber(season.monthEnd),
        dayStart: optionalNumber(season.dayStart),
        dayEnd: optionalNumber(season.dayEnd)
      })),
      daysPerYear: calendar.days.daysPerYear,
      hoursPerDay: calendar.days.hoursPerDay,
      minutesPerHour: calendar.days.minutesPerHour,
      secondsPerMinute: calendar.days.secondsPerMinute
    };
  }

  decompose(worldTime: number): CalendarComponents {
    const components = this.calendar(this.gameProvider.getGame()).timeToComponents(worldTime);
    return {
      year: components.year,
      dayOfYear: components.day,
      month: components.month,
      dayOfMonth: components.dayOfMonth,
      weekday: components.dayOfWeek,
      hour: components.hour,
      minute: components.minute,
      second: components.second,
      season: typeof components.season === 'number' ? components.season : null,
      leapYear: components.leapYear
    };
  }

  startOfYear(year: number): number {
    return this.calendar(this.gameProvider.getGame()).componentsToTime({ year });
  }

  /** A formatter a system registered may throw; the core's own timestamp layout stands in for it. */
  format(worldTime: number): string {
    const calendar = this.calendar(this.gameProvider.getGame());
    try {
      return calendar.format(worldTime);
    } catch {
      const c = calendar.timeToComponents(worldTime);
      const month = calendar.months?.values[c.month]?.ordinal ?? c.month + 1;
      return `${pad(c.year, 4)}-${pad(month, 2)}-${pad(c.dayOfMonth + 1, 2)} ${pad(c.hour, 2)}:${pad(c.minute, 2)}:${pad(c.second, 2)}`;
    }
  }

  private calendar(game: FoundryRunningGame): FoundryCalendar {
    const calendar = game.time.calendar;
    if (calendar === undefined) {
      throw new CoreFeatureUnavailableError(CALENDAR_UNAVAILABLE);
    }
    return calendar;
  }
}
