import {
  breakDownSeconds,
  type CalendarDate,
  type CalendarDefinition,
  type DurationBreakdown,
  type WorldCalendar,
  type WorldClock
} from '@/core/world/domain';
import { dateOf, requireCalendar, worldTimeOf } from './calendarAccess';
import type { TimeDifferenceQuery } from './commands';

export interface CalendarServiceDependencies {
  readonly clock: WorldClock;
  readonly calendar: WorldCalendar;
}

export interface CalendarOverview {
  readonly definition: CalendarDefinition;
  readonly now: CalendarDate;
}

export interface TimeDifference {
  readonly from: CalendarDate;
  readonly to: CalendarDate;
  /** `to` minus `from`. */
  readonly seconds: number;
  readonly duration: DurationBreakdown;
}

/** Read-only questions about the world calendar; every one is refused below Foundry 13. */
export class CalendarService {
  constructor(private readonly deps: CalendarServiceDependencies) {}

  getCalendar(): CalendarOverview {
    const calendar = requireCalendar(this.deps.calendar);
    return { definition: calendar.definition(), now: dateOf(calendar, this.deps.clock.now()) };
  }

  difference(query: TimeDifferenceQuery): TimeDifference {
    const calendar = requireCalendar(this.deps.calendar);
    const from = query.from === undefined ? this.deps.clock.now() : worldTimeOf(calendar, query.from);
    const to = worldTimeOf(calendar, query.to);
    const seconds = to - from;
    return {
      from: dateOf(calendar, from),
      to: dateOf(calendar, to),
      seconds,
      duration: breakDownSeconds(calendar.definition(), seconds)
    };
  }
}
