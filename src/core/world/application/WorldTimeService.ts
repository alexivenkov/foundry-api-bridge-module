import {
  NegativeWorldTimeError,
  durationToSeconds,
  resolveCalendarDate,
  type CalendarDate,
  type WorldCalendar,
  type WorldClock
} from '@/core/world/domain';
import { dateOf, hasCalendar, requireCalendar } from './calendarAccess';
import type { AdvanceTimeCommand, SetWorldTimeCommand } from './commands';

export interface WorldTimeServiceDependencies {
  readonly clock: WorldClock;
  /** Without one (or below Foundry 13) results carry no date and calendar-based changes are refused. */
  readonly calendar?: WorldCalendar | undefined;
}

export interface TimeAdvanceResult {
  readonly worldTime: number;
  readonly advancedBy: number;
  readonly date?: CalendarDate;
}

export interface WorldTimeReading {
  readonly worldTime: number;
  readonly date?: CalendarDate;
}

export class WorldTimeService {
  constructor(private readonly deps: WorldTimeServiceDependencies) {}

  readTime(): WorldTimeReading {
    const worldTime = this.deps.clock.now();
    return this.withDate({ worldTime }, worldTime);
  }

  /** The time reported is the one the clock shows once the change has landed. */
  async advanceTime(command: AdvanceTimeCommand): Promise<TimeAdvanceResult> {
    const seconds =
      command.duration !== undefined
        ? durationToSeconds(requireCalendar(this.deps.calendar).definition(), command.duration)
        : command.seconds;
    await this.deps.clock.advance(seconds);
    const worldTime = this.deps.clock.now();
    return this.withDate({ worldTime, advancedBy: seconds }, worldTime);
  }

  async setTime(command: SetWorldTimeCommand): Promise<WorldTimeReading> {
    const target = command.date !== undefined ? this.resolveDate(command.date) : command.worldTime;
    if (target < 0) {
      throw new NegativeWorldTimeError();
    }
    await this.deps.clock.set(target);
    const worldTime = this.deps.clock.now();
    return this.withDate({ worldTime }, worldTime);
  }

  private resolveDate(date: NonNullable<SetWorldTimeCommand['date']>): number {
    const calendar = requireCalendar(this.deps.calendar);
    return resolveCalendarDate(calendar.definition(), date, calendar);
  }

  private withDate<T extends object>(result: T, worldTime: number): T & { date?: CalendarDate } {
    return hasCalendar(this.deps.calendar) ? { ...result, date: dateOf(this.deps.calendar, worldTime) } : result;
  }
}
