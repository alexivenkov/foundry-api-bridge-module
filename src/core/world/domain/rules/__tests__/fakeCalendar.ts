import type { CalendarComponents, CalendarDefinition } from '../../model/Calendar';
import type { WorldCalendar } from '../../ports/WorldCalendar';

/**
 * A small calendar with the core's shape: three months of ten days (the first
 * has eleven in a leap year, every fourth year from year 0), ten-hour days of
 * ten ten-second minutes — a day is 1000 seconds. Decomposition walks the years
 * like `CalendarData#timeToComponents`; `startOfYear` can be skewed to play the
 * core's inconsistent `componentsToTime`.
 */
export const FAKE_CALENDAR: CalendarDefinition = {
  name: 'Fake',
  description: null,
  yearZero: 0,
  firstWeekday: 0,
  leapYear: { leapStart: 0, leapInterval: 4 },
  months: [
    { name: 'Frost', abbreviation: 'Fr', ordinal: 1, days: 10, leapDays: 11 },
    { name: 'Thaw', abbreviation: null, ordinal: 2, days: 10, leapDays: null },
    { name: 'Bloom', abbreviation: null, ordinal: 3, days: 10, leapDays: null }
  ],
  weekdays: [
    { name: 'Oneday', abbreviation: null, ordinal: 1 },
    { name: 'Twoday', abbreviation: null, ordinal: 2 },
    { name: 'Threeday', abbreviation: null, ordinal: 3 }
  ],
  seasons: [
    { name: 'Cold', abbreviation: null, monthStart: 1, monthEnd: 2, dayStart: null, dayEnd: null },
    { name: 'Warm', abbreviation: null, monthStart: 3, monthEnd: 3, dayStart: null, dayEnd: null }
  ],
  daysPerYear: 30,
  hoursPerDay: 10,
  minutesPerHour: 10,
  secondsPerMinute: 10
};

const DAY = 1000;

function isLeap(year: number): boolean {
  return year % 4 === 0;
}

function yearLength(year: number): number {
  return isLeap(year) ? 31 : 30;
}

export class FakeCalendar implements WorldCalendar {
  available = true;
  /** Days added to the estimate `startOfYear` gives. */
  skew = 0;
  readonly decomposed: number[] = [];

  isAvailable(): boolean {
    return this.available;
  }

  definition(): CalendarDefinition {
    return FAKE_CALENDAR;
  }

  decompose(worldTime: number): CalendarComponents {
    this.decomposed.push(worldTime);
    let days = Math.floor(worldTime / DAY);
    let rest = worldTime - days * DAY;
    let year = 0;
    while (days >= yearLength(year)) {
      days -= yearLength(year);
      year += 1;
    }
    const dayOfYear = days;
    let month = 0;
    for (const m of FAKE_CALENDAR.months) {
      const length = isLeap(year) ? (m.leapDays ?? m.days) : m.days;
      if (days < length) {
        break;
      }
      days -= length;
      month += 1;
    }
    const hour = Math.floor(rest / 100);
    rest -= hour * 100;
    const minute = Math.floor(rest / 10);
    rest -= minute * 10;
    return {
      year,
      dayOfYear,
      month,
      dayOfMonth: days,
      weekday: Math.floor(worldTime / DAY) % 3,
      hour,
      minute,
      second: rest,
      season: month < 2 ? 0 : 1,
      leapYear: isLeap(year)
    };
  }

  startOfYear(year: number): number {
    let days = 0;
    for (let y = 0; y < year; y += 1) {
      days += yearLength(y);
    }
    return (days + this.skew) * DAY;
  }

  format(worldTime: number): string {
    return `t=${String(worldTime)}`;
  }
}
