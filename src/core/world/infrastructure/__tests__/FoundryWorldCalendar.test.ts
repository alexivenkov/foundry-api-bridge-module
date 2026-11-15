import { FoundryWorldCalendar } from '../FoundryWorldCalendar';
import type { FoundryCalendar, FoundryRunningGame } from '../foundryWorldTypes';

// Shaped like `game.time.calendar` built from SIMPLIFIED_GREGORIAN_CALENDAR_CONFIG, as the
// probe printed it on 13.351 and 14.368: names are localization keys, weekdays carry no
// `isRestDay` (the schema drops it), and `timeToComponents(0)` answers the object below.
function gregorian(overrides: Partial<FoundryCalendar> = {}): FoundryCalendar {
  return {
    name: 'Simplified Gregorian',
    description: 'The Gregorian calendar with some simplifications.',
    years: { yearZero: 0, firstWeekday: 0, leapYear: { leapStart: 8, leapInterval: 4 } },
    months: {
      values: [
        { name: 'CALENDAR.GREGORIAN.January', abbreviation: 'CALENDAR.GREGORIAN.JanuaryAbbr', ordinal: 1, days: 31 },
        { name: 'CALENDAR.GREGORIAN.February', abbreviation: 'CALENDAR.GREGORIAN.FebruaryAbbr', ordinal: 2, days: 28, leapDays: 29 }
      ]
    },
    days: {
      values: [
        { name: 'CALENDAR.GREGORIAN.Monday', abbreviation: 'CALENDAR.GREGORIAN.MondayAbbr', ordinal: 1 },
        { name: 'CALENDAR.GREGORIAN.Tuesday', abbreviation: '', ordinal: 2 }
      ],
      daysPerYear: 365,
      hoursPerDay: 24,
      minutesPerHour: 60,
      secondsPerMinute: 60
    },
    seasons: { values: [{ name: 'CALENDAR.GREGORIAN.Winter', monthStart: 12, monthEnd: 2 }] },
    timeToComponents: jest.fn(() => ({
      day: 0,
      dayOfMonth: 0,
      dayOfWeek: 0,
      hour: 0,
      leapYear: false,
      minute: 0,
      month: 0,
      season: 3,
      second: 0,
      year: 0
    })),
    componentsToTime: jest.fn(() => 2_920 * 86_400),
    format: jest.fn(() => '0000-01-01 00:00:00'),
    ...overrides
  };
}

function gatewayOver(calendar: FoundryCalendar | undefined): FoundryWorldCalendar {
  const game: FoundryRunningGame = {
    time: { worldTime: 0, advance: jest.fn(), set: jest.fn(), calendar },
    paused: false,
    togglePause: jest.fn(),
    i18n: { localize: (key: string) => key.replace('CALENDAR.GREGORIAN.', '') }
  };
  return new FoundryWorldCalendar({ getGame: () => game });
}

describe('FoundryWorldCalendar', () => {
  it('is available only where the core has a calendar (13+)', () => {
    expect(gatewayOver(gregorian()).isAvailable()).toBe(true);
    expect(gatewayOver(undefined).isAvailable()).toBe(false);
  });

  it('reads the definition with localized names', () => {
    const definition = gatewayOver(gregorian()).definition();

    expect(definition).toMatchObject({
      name: 'Simplified Gregorian',
      yearZero: 0,
      firstWeekday: 0,
      leapYear: { leapStart: 8, leapInterval: 4 },
      daysPerYear: 365,
      hoursPerDay: 24,
      minutesPerHour: 60,
      secondsPerMinute: 60
    });
    expect(definition.months).toEqual([
      { name: 'January', abbreviation: 'JanuaryAbbr', ordinal: 1, days: 31, leapDays: null },
      { name: 'February', abbreviation: 'FebruaryAbbr', ordinal: 2, days: 28, leapDays: 29 }
    ]);
    expect(definition.weekdays).toEqual([
      { name: 'Monday', abbreviation: 'MondayAbbr', ordinal: 1 },
      { name: 'Tuesday', abbreviation: null, ordinal: 2 }
    ]);
    expect(definition.seasons).toEqual([
      { name: 'Winter', abbreviation: null, monthStart: 12, monthEnd: 2, dayStart: null, dayEnd: null }
    ]);
  });

  it('reads a calendar without months, seasons, leap years or description', () => {
    const definition = gatewayOver(
      gregorian({ months: null, seasons: null, description: '', years: { yearZero: 0, firstWeekday: 0, leapYear: null } })
    ).definition();

    expect(definition).toMatchObject({ months: [], seasons: [], description: null, leapYear: null });
  });

  it('renames the core components into the domain vocabulary', () => {
    const calendar = gregorian();

    expect(gatewayOver(calendar).decompose(0)).toEqual({
      year: 0,
      dayOfYear: 0,
      month: 0,
      dayOfMonth: 0,
      weekday: 0,
      hour: 0,
      minute: 0,
      second: 0,
      season: 3,
      leapYear: false
    });
    expect(calendar.timeToComponents).toHaveBeenCalledWith(0);
  });

  it('reads an unmatched season as null', () => {
    const calendar = gregorian({
      timeToComponents: () => ({ day: 0, dayOfMonth: 0, dayOfWeek: 0, hour: 0, leapYear: false, minute: 0, month: 0, second: 0, year: 0 })
    });

    expect(gatewayOver(calendar).decompose(0).season).toBeNull();
  });

  it('asks componentsToTime where a year starts', () => {
    const calendar = gregorian();

    expect(gatewayOver(calendar).startOfYear(8)).toBe(2_920 * 86_400);
    expect(calendar.componentsToTime).toHaveBeenCalledWith({ year: 8 });
  });

  it('formats through the core and falls back to its timestamp layout when a formatter throws', () => {
    expect(gatewayOver(gregorian()).format(0)).toBe('0000-01-01 00:00:00');
    const broken = gregorian({
      format: () => {
        throw new Error('formatter missing');
      }
    });
    expect(gatewayOver(broken).format(0)).toBe('0000-01-01 00:00:00');
  });

  it('refuses to read a calendar that is not there', () => {
    expect(() => gatewayOver(undefined).definition()).toThrow('The world calendar requires Foundry 13 or newer');
  });
});
