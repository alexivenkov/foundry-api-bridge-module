import type { FoundryCalendar, FoundryRunningGame } from '../../../../core/world/infrastructure';
import { createAdvanceTimeHandler } from '../AdvanceTimeHandler';
import { createGetCalendarHandler } from '../GetCalendarHandler';
import { createGetTimeDifferenceHandler } from '../GetTimeDifferenceHandler';
import { createGetWorldTimeHandler, type RunningGameHandlerDependencies } from '../GetWorldTimeHandler';
import { createSetWorldTimeHandler } from '../SetWorldTimeHandler';

const DAY = 86_400;

/** A core calendar of twelve 30-day months and 24-hour days, no leap years, decomposed like `CalendarData`. */
function calendar(): FoundryCalendar {
  const months = Array.from({ length: 12 }, (_, index) => ({ name: `Month ${String(index + 1)}`, ordinal: index + 1, days: 30 }));
  return {
    name: 'Thirty',
    description: '',
    years: { yearZero: 0, firstWeekday: 0, leapYear: null },
    months: { values: months },
    days: {
      values: [{ name: 'Moonday', ordinal: 1 }, { name: 'Sunday', ordinal: 2 }],
      daysPerYear: 360,
      hoursPerDay: 24,
      minutesPerHour: 60,
      secondsPerMinute: 60
    },
    seasons: null,
    timeToComponents: (time: number) => {
      const days = Math.floor(time / DAY);
      let rest = time - days * DAY;
      const hour = Math.floor(rest / 3600);
      rest -= hour * 3600;
      const minute = Math.floor(rest / 60);
      return {
        year: Math.floor(days / 360),
        day: days % 360,
        month: Math.floor((days % 360) / 30),
        dayOfMonth: days % 30,
        dayOfWeek: days % 2,
        hour,
        minute,
        second: rest - minute * 60,
        leapYear: false
      };
    },
    componentsToTime: ({ year = 0 }) => year * 360 * DAY,
    format: (time: number) => `formatted ${String(time)}`
  };
}

interface World {
  deps: RunningGameHandlerDependencies;
  game: FoundryRunningGame;
}

function world(worldTime: number, withCalendar = true): World {
  const game: FoundryRunningGame = {
    time: {
      worldTime,
      advance: jest.fn((seconds: number) => {
        game.time.worldTime += seconds;
        return Promise.resolve(game.time.worldTime);
      }),
      set: jest.fn((seconds: number) => {
        game.time.worldTime = seconds;
        return Promise.resolve(seconds);
      }),
      calendar: withCalendar ? calendar() : undefined
    },
    paused: false,
    togglePause: jest.fn(),
    i18n: { localize: (key: string) => key }
  };
  return { deps: { gameProvider: { getGame: () => game } }, game };
}

describe('calendar handlers', () => {
  it('get-calendar answers the definition and now', async () => {
    const result = await createGetCalendarHandler(world(DAY * 31 + 3600).deps)({});

    expect(result.calendar).toMatchObject({ name: 'Thirty', description: null, daysPerYear: 360, leapYear: null, seasons: [] });
    expect(result.calendar.months).toHaveLength(12);
    expect(result.now).toEqual({
      worldTime: DAY * 31 + 3600,
      year: 0,
      month: 2,
      monthName: 'Month 2',
      day: 2,
      dayOfYear: 32,
      weekday: 'Sunday',
      hour: 1,
      minute: 0,
      second: 0,
      season: null,
      leapYear: false,
      formatted: `formatted ${String(DAY * 31 + 3600)}`
    });
  });

  it('get-calendar is refused below Foundry 13', async () => {
    await expect(createGetCalendarHandler(world(0, false).deps)({})).rejects.toThrow(
      'The world calendar requires Foundry 13 or newer'
    );
  });

  it('get-time-difference measures from now to a date', async () => {
    const result = await createGetTimeDifferenceHandler(world(0).deps)({ toDate: { year: 1, month: 1, day: 2, hour: 6 } });

    expect(result.seconds).toBe(361 * DAY + 6 * 3600);
    expect(result.duration).toEqual({ days: 361, hours: 6, minutes: 0, seconds: 0 });
    expect(result.to).toMatchObject({ year: 1, month: 1, day: 2, hour: 6 });
  });

  it('get-time-difference rejects a request without an end', async () => {
    await expect(createGetTimeDifferenceHandler(world(0).deps)({ fromWorldTime: 3 })).rejects.toThrow(
      'give exactly one of toWorldTime and toDate'
    );
  });

  it('get-world-time adds the calendar date on 13+', async () => {
    const result = await createGetWorldTimeHandler(world(DAY).deps)({});

    expect(result).toMatchObject({ worldTime: DAY, date: { month: 1, day: 2, weekday: 'Sunday' } });
  });

  it('advance-time takes a calendar duration', async () => {
    const { deps, game } = world(0);

    const result = await createAdvanceTimeHandler(deps)({ duration: { days: 1, hours: 2 } });

    expect(game.time.advance).toHaveBeenCalledWith(DAY + 7200);
    expect(result).toMatchObject({ worldTime: DAY + 7200, advancedBy: DAY + 7200, date: { day: 2, hour: 2 } });
  });

  it('advance-time refuses a duration below Foundry 13 and keeps plain seconds working', async () => {
    const { deps, game } = world(0, false);

    await expect(createAdvanceTimeHandler(deps)({ duration: { days: 1 } })).rejects.toThrow('Foundry 13');
    await expect(createAdvanceTimeHandler(deps)({ seconds: 30 })).resolves.toEqual({ worldTime: 30, advancedBy: 30 });
    expect(game.time.advance).toHaveBeenCalledTimes(1);
  });

  it('set-world-time takes a calendar date', async () => {
    const { deps, game } = world(0);

    const result = await createSetWorldTimeHandler(deps)({ date: { year: 2, month: 3, day: 4, hour: 5 } });

    const expected = (2 * 360 + 2 * 30 + 3) * DAY + 5 * 3600;
    expect(game.time.set).toHaveBeenCalledWith(expected);
    expect(result).toMatchObject({ worldTime: expected, date: { year: 2, month: 3, day: 4, hour: 5 } });
  });

  it('set-world-time rejects a date outside the calendar', async () => {
    const { deps, game } = world(0);

    await expect(createSetWorldTimeHandler(deps)({ date: { year: 1, month: 13, day: 1 } })).rejects.toThrow(
      'Invalid calendar date: month must be from 1 to 12'
    );
    await expect(createSetWorldTimeHandler(deps)({ date: { year: 1, month: 2, day: 31 } })).rejects.toThrow(
      'day must be from 1 to 30'
    );
    expect(game.time.set).not.toHaveBeenCalled();
  });
});
