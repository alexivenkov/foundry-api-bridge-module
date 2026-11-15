import {
  advanceTimeRequestSchema,
  setWorldTimeRequestSchema,
  toAdvanceTimeCommand,
  toSetWorldTimeCommand
} from '..';

describe('world request schemas', () => {
  it.each([60, -30, 0, 0.5, 86_400])('accepts a step of %d seconds', (seconds) => {
    expect(advanceTimeRequestSchema.parse({ seconds })).toEqual({ seconds });
  });

  it.each([
    ['no step', {}],
    ['a numeric string', { seconds: '60' }],
    ['null', { seconds: null }],
    ['time components', { seconds: { hour: 1 } }]
  ])('rejects %s as a step', (_case, request) => {
    expect(advanceTimeRequestSchema.safeParse(request).success).toBe(false);
  });

  it('leaves a negative world time to the service, which answers with its own text', () => {
    expect(setWorldTimeRequestSchema.parse({ worldTime: -1 })).toEqual({ worldTime: -1 });
  });

  it.each([
    ['no time', {}],
    ['a numeric string', { worldTime: '100' }]
  ])('rejects %s as a world time', (_case, request) => {
    expect(setWorldTimeRequestSchema.safeParse(request).success).toBe(false);
  });

  it('ignores unknown keys', () => {
    expect(advanceTimeRequestSchema.parse({ seconds: 1, reason: 'long rest' })).toEqual({ seconds: 1 });
    expect(setWorldTimeRequestSchema.parse({ worldTime: 1, calendar: 'x' })).toEqual({ worldTime: 1 });
  });
});

describe('world request mappers', () => {
  it('maps the step and the time as they came', () => {
    expect(toAdvanceTimeCommand({ seconds: -30 })).toEqual({ seconds: -30 });
    expect(toSetWorldTimeCommand({ worldTime: 0 })).toEqual({ worldTime: 0 });
  });
});
