import { CoreFeatureUnavailableError } from '../../../shared';
import type { WorldSession } from '../../domain';
import { FakeCalendar } from '../../domain/rules/__tests__/fakeCalendar';
import { CalendarService } from '../CalendarService';
import { WorldSessionService } from '../WorldSessionService';
import { WorldTimeService } from '../WorldTimeService';
import { FakeWorldClock } from './fakePorts';

const REFUSAL = 'The world calendar requires Foundry 13 or newer';

function timeService(time = 45_123, available = true): { clock: FakeWorldClock; calendar: FakeCalendar; service: WorldTimeService } {
  const clock = new FakeWorldClock(time);
  const calendar = new FakeCalendar();
  calendar.available = available;
  return { clock, calendar, service: new WorldTimeService({ clock, calendar }) };
}

describe('WorldTimeService with a calendar', () => {
  it('reads the time with its calendar date', () => {
    const reading = timeService().service.readTime();

    expect(reading.worldTime).toBe(45_123);
    expect(reading.date).toMatchObject({ year: 1, month: 2, monthName: 'Thaw', day: 5, formatted: 't=45123' });
  });

  it('leaves the date out where the core has no calendar', () => {
    const { service } = timeService(500, false);

    expect(service.readTime()).toEqual({ worldTime: 500 });
    expect(new WorldTimeService({ clock: new FakeWorldClock(7) }).readTime()).toEqual({ worldTime: 7 });
  });

  it('advances by a calendar duration and reports the new date', async () => {
    const { clock, service } = timeService(0);

    const result = await service.advanceTime({ duration: { days: 2, hours: 3 } });

    expect(clock.calls).toEqual(['advance:2300']);
    expect(result).toMatchObject({ worldTime: 2300, advancedBy: 2300, date: { day: 3, hour: 3 } });
  });

  it('adds the date to a plain advance by seconds', async () => {
    const result = await timeService(0).service.advanceTime({ seconds: 100 });

    expect(result).toMatchObject({ worldTime: 100, advancedBy: 100, date: { hour: 1 } });
  });

  it('refuses a duration without a calendar and leaves the clock alone', async () => {
    const { clock, service } = timeService(0, false);

    await expect(service.advanceTime({ duration: { days: 1 } })).rejects.toThrow(new CoreFeatureUnavailableError(REFUSAL));
    expect(clock.calls).toEqual([]);
  });

  it('sets the clock to a calendar date', async () => {
    const { clock, service } = timeService(0);

    const reading = await service.setTime({ date: { year: 1, month: 2, day: 5, hour: 1, minute: 2, second: 3 } });

    expect(clock.calls).toEqual(['set:45123']);
    expect(reading).toMatchObject({ worldTime: 45_123, date: { year: 1, month: 2, day: 5 } });
  });

  it('refuses a date the calendar lacks before touching the clock', async () => {
    const { clock, service } = timeService(0);

    await expect(service.setTime({ date: { year: 5, month: 1, day: 11 } })).rejects.toThrow(
      'Day 11 of month 1 does not exist in year 5'
    );
    await expect(timeService(0, false).service.setTime({ date: { year: 1, month: 1, day: 1 } })).rejects.toThrow(REFUSAL);
    expect(clock.calls).toEqual([]);
  });

  it('adds the date to a plain set by world time', async () => {
    await expect(timeService(0).service.setTime({ worldTime: 2000 })).resolves.toMatchObject({
      worldTime: 2000,
      date: { day: 3 }
    });
  });
});

describe('CalendarService', () => {
  function calendarService(time = 45_123, available = true): CalendarService {
    const calendar = new FakeCalendar();
    calendar.available = available;
    return new CalendarService({ clock: new FakeWorldClock(time), calendar });
  }

  it('answers the definition and now', () => {
    const overview = calendarService().getCalendar();

    expect(overview.definition.name).toBe('Fake');
    expect(overview.now).toMatchObject({ worldTime: 45_123, month: 2, day: 5 });
  });

  it('measures from now to a date', () => {
    const difference = calendarService(0).difference({ from: undefined, to: { date: { year: 0, month: 1, day: 3, hour: 4 } } });

    expect(difference.seconds).toBe(2400);
    expect(difference.duration).toEqual({ days: 2, hours: 4, minutes: 0, seconds: 0 });
    expect(difference.from.worldTime).toBe(0);
    expect(difference.to).toMatchObject({ day: 3, hour: 4 });
  });

  it('keeps the sign of a span that runs backwards', () => {
    const difference = calendarService().difference({ from: { worldTime: 5000 }, to: { worldTime: 3900 } });

    expect(difference.seconds).toBe(-1100);
    expect(difference.duration).toEqual({ days: 1, hours: 1, minutes: 0, seconds: 0 });
  });

  it('refuses everything below Foundry 13', () => {
    const service = calendarService(0, false);

    expect(() => service.getCalendar()).toThrow(REFUSAL);
    expect(() => service.difference({ from: undefined, to: { worldTime: 1 } })).toThrow(CoreFeatureUnavailableError);
  });
});

describe('WorldSessionService', () => {
  it('answers what the inspector reads', () => {
    const session: WorldSession = { modules: [], activeScene: null, users: [], paused: true, worldTime: 3 };

    expect(new WorldSessionService({ session: { readSession: () => session } }).getSession()).toBe(session);
  });
});
