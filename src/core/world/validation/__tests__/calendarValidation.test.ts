import { parseRequest } from '../../../shared';
import {
  advanceTimeSchemaFor,
  getTimeDifferenceRequestSchema,
  setWorldTimeSchemaFor,
  toAdvanceTimeCommand,
  toSetWorldTimeCommand,
  toTimeDifferenceQuery
} from '..';

function advance(params: unknown): ReturnType<typeof toAdvanceTimeCommand> {
  return toAdvanceTimeCommand(parseRequest(advanceTimeSchemaFor(params), params));
}

function setTime(params: unknown): ReturnType<typeof toSetWorldTimeCommand> {
  return toSetWorldTimeCommand(parseRequest(setWorldTimeSchemaFor(params), params));
}

describe('advance-time forms', () => {
  it('reads the old form exactly as before, error text included', () => {
    expect(advance({ seconds: 60 })).toEqual({ seconds: 60 });
    expect(() => advance({})).toThrow('seconds');
    expect(() => advance({ seconds: '60' })).toThrow('seconds');
  });

  it('reads a duration form', () => {
    expect(advance({ duration: { days: 1, hours: -2 } })).toEqual({ duration: { days: 1, hours: -2 } });
  });

  it.each([
    ['both forms', { seconds: 5, duration: { days: 1 } }, 'give either seconds or duration, not both'],
    ['an empty duration', { duration: {} }, 'needs at least one of days, hours, minutes, seconds'],
    ['a fractional day', { duration: { days: 1.5 } }, 'duration.days'],
    ['a null duration', { duration: null }, 'duration']
  ])('rejects %s', (_case, params, message) => {
    expect(() => advance(params)).toThrow(message);
  });
});

describe('set-world-time forms', () => {
  it('reads the old form as before', () => {
    expect(setTime({ worldTime: -1 })).toEqual({ worldTime: -1 });
    expect(() => setTime({})).toThrow('worldTime');
  });

  it('reads a date form', () => {
    expect(setTime({ date: { year: 1492, month: 4, day: 3, hour: 14 } })).toEqual({
      date: { year: 1492, month: 4, day: 3, hour: 14, minute: undefined, second: undefined }
    });
  });

  it.each([
    ['both forms', { worldTime: 1, date: { year: 1, month: 1, day: 1 } }, 'give either worldTime or date, not both'],
    ['month 0', { date: { year: 1, month: 0, day: 1 } }, 'date.month'],
    ['a negative year', { date: { year: -3, month: 1, day: 1 } }, 'date.year'],
    ['a fractional hour', { date: { year: 1, month: 1, day: 1, hour: 1.5 } }, 'date.hour'],
    ['no day', { date: { year: 1, month: 1 } }, 'date.day']
  ])('rejects %s', (_case, params, message) => {
    expect(() => setTime(params)).toThrow(message);
  });
});

describe('get-time-difference', () => {
  it('needs exactly one end and at most one start', () => {
    expect(getTimeDifferenceRequestSchema.safeParse({}).success).toBe(false);
    expect(getTimeDifferenceRequestSchema.safeParse({ toWorldTime: 1, toDate: { year: 0, month: 1, day: 1 } }).success).toBe(false);
    expect(
      getTimeDifferenceRequestSchema.safeParse({ toWorldTime: 1, fromWorldTime: 0, fromDate: { year: 0, month: 1, day: 1 } })
        .success
    ).toBe(false);
    expect(getTimeDifferenceRequestSchema.safeParse({ toWorldTime: -1 }).success).toBe(false);
  });

  it('maps both ends, the start defaulting to now', () => {
    expect(toTimeDifferenceQuery(getTimeDifferenceRequestSchema.parse({ toWorldTime: 100 }))).toEqual({
      from: undefined,
      to: { worldTime: 100 }
    });
    expect(
      toTimeDifferenceQuery(
        getTimeDifferenceRequestSchema.parse({ fromWorldTime: 5, toDate: { year: 2, month: 3, day: 4 } })
      )
    ).toEqual({
      from: { worldTime: 5 },
      to: { date: { year: 2, month: 3, day: 4, hour: undefined, minute: undefined, second: undefined } }
    });
  });

  it('guards the end even past the schema', () => {
    expect(() => toTimeDifferenceQuery({})).toThrow('toDate');
  });
});
