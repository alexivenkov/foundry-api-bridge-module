import { CalendarDateNotFoundError, InvalidCalendarDateError } from '../../errors/calendarErrors';
import {
  assertDateFits,
  breakDownSeconds,
  describeDate,
  durationToSeconds,
  resolveCalendarDate
} from '../calendarRules';
import { FAKE_CALENDAR, FakeCalendar } from './fakeCalendar';

describe('calendar durations', () => {
  it('counts days, hours and minutes in the calendar units', () => {
    expect(durationToSeconds(FAKE_CALENDAR, { days: 1, hours: 2, minutes: 3, seconds: 4 })).toBe(1234);
    expect(durationToSeconds(FAKE_CALENDAR, { hours: -1 })).toBe(-100);
    expect(durationToSeconds(FAKE_CALENDAR, {})).toBe(0);
  });

  it('breaks the absolute length of a span into calendar units', () => {
    expect(breakDownSeconds(FAKE_CALENDAR, 1234)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 });
    expect(breakDownSeconds(FAKE_CALENDAR, -1234)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 });
    expect(breakDownSeconds(FAKE_CALENDAR, 5.5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 5.5 });
  });
});

describe('describeDate', () => {
  it('turns the core indexes into 1-based positions and names', () => {
    const calendar = new FakeCalendar();
    const worldTime = 45_123;

    expect(describeDate(FAKE_CALENDAR, worldTime, calendar.decompose(worldTime), 'text')).toEqual({
      worldTime,
      year: 1,
      month: 2,
      monthName: 'Thaw',
      day: 5,
      dayOfYear: 15,
      weekday: 'Oneday',
      hour: 1,
      minute: 2,
      second: 3,
      season: 'Cold',
      leapYear: false,
      formatted: 'text'
    });
  });

  it('reads a missing season as null', () => {
    const components = { ...new FakeCalendar().decompose(0), season: null };

    expect(describeDate(FAKE_CALENDAR, 0, components, '').season).toBeNull();
  });
});

describe('assertDateFits', () => {
  it.each([
    [{ year: -1, month: 1, day: 1 }, 'Invalid calendar date: year must not be negative'],
    [{ year: 1, month: 0, day: 1 }, 'Invalid calendar date: month must be from 1 to 3'],
    [{ year: 1, month: 4, day: 1 }, 'Invalid calendar date: month must be from 1 to 3'],
    [{ year: 1, month: 1, day: 12 }, 'Invalid calendar date: day must be from 1 to 11 in month 1'],
    [{ year: 1, month: 2, day: 11 }, 'Invalid calendar date: day must be from 1 to 10 in month 2'],
    [{ year: 1, month: 1, day: 1, hour: 10 }, 'Invalid calendar date: hour must be from 0 to 9'],
    [{ year: 1, month: 1, day: 1, minute: 10 }, 'Invalid calendar date: minute must be from 0 to 9'],
    [{ year: 1, month: 1, day: 1, second: 10 }, 'Invalid calendar date: second must be from 0 to 9']
  ])('refuses %p', (date, message) => {
    expect(() => {
      assertDateFits(FAKE_CALENDAR, date);
    }).toThrow(new InvalidCalendarDateError(message.replace('Invalid calendar date: ', '')));
  });

  it('refuses any date on a calendar without months', () => {
    expect(() => {
      assertDateFits({ ...FAKE_CALENDAR, months: [] }, { year: 0, month: 1, day: 1 });
    }).toThrow('the calendar has no months');
  });
});

describe('resolveCalendarDate', () => {
  it('finds the world time the core decomposes into the date', () => {
    const calendar = new FakeCalendar();

    const worldTime = resolveCalendarDate(FAKE_CALENDAR, { year: 1, month: 2, day: 5, hour: 1, minute: 2, second: 3 }, calendar);

    expect(worldTime).toBe(45_123);
    expect(calendar.decompose(worldTime)).toMatchObject({ year: 1, month: 1, dayOfMonth: 4, hour: 1, minute: 2, second: 3 });
  });

  it('starts at midnight when no time is given', () => {
    expect(resolveCalendarDate(FAKE_CALENDAR, { year: 0, month: 1, day: 1 }, new FakeCalendar())).toBe(0);
  });

  it('finds a leap day in a leap year and refuses it in another', () => {
    const calendar = new FakeCalendar();

    const leapDay = resolveCalendarDate(FAKE_CALENDAR, { year: 4, month: 1, day: 11 }, calendar);

    expect(calendar.decompose(leapDay)).toMatchObject({ year: 4, month: 0, dayOfMonth: 10, leapYear: true });
    expect(() => resolveCalendarDate(FAKE_CALENDAR, { year: 5, month: 1, day: 11 }, calendar)).toThrow(
      new CalendarDateNotFoundError(5, 1, 11)
    );
  });

  it.each([-40, -1, 1, 40])('trusts the decomposition over an estimate that is %d days off', (skew) => {
    const calendar = new FakeCalendar();
    calendar.skew = skew;

    const worldTime = resolveCalendarDate(FAKE_CALENDAR, { year: 9, month: 3, day: 2 }, calendar);

    expect(calendar.decompose(worldTime)).toMatchObject({ year: 9, month: 2, dayOfMonth: 1 });
  });

  it('checks the date against the calendar before searching', () => {
    const calendar = new FakeCalendar();

    expect(() => resolveCalendarDate(FAKE_CALENDAR, { year: 1, month: 9, day: 1 }, calendar)).toThrow(
      InvalidCalendarDateError
    );
    expect(calendar.decomposed).toEqual([]);
  });

  it('says which day is missing', () => {
    expect(new CalendarDateNotFoundError(5, 1, 11).message).toBe('Day 11 of month 1 does not exist in year 5');
  });
});
