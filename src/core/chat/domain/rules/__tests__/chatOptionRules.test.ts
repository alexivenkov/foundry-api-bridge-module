import {
  MAX_SIMULATED_DICE,
  TooManySimulatedDiceError,
  UnresolvedRollDataError,
  VisibilityConflictsWithWhisperError,
  WhisperRecipientNotFoundError,
  assertSimulationBudget,
  assertVisibilityFitsRecipients,
  mergeRecipients,
  summarizeTotals,
  toRollDataSpec
} from '../..';

describe('mergeRecipients', () => {
  it('keeps every recipient once, in the order first named', () => {
    expect(mergeRecipients(['u1', 'u2'], ['u2', 'u3', 'u1'])).toEqual(['u1', 'u2', 'u3']);
  });

  it('merges nothing into nothing', () => {
    expect(mergeRecipients([], [])).toEqual([]);
  });
});

describe('assertVisibilityFitsRecipients', () => {
  it.each(['public', 'self'] as const)('refuses %s with recipients', (visibility) => {
    expect(() => assertVisibilityFitsRecipients(visibility, ['u1'])).toThrow(VisibilityConflictsWithWhisperError);
    expect(() => assertVisibilityFitsRecipients(visibility, ['u1'])).toThrow(
      `Visibility '${visibility}' cannot be combined with whisper recipients`
    );
  });

  it.each(['gm', 'blind'] as const)('lets %s keep its recipients', (visibility) => {
    expect(() => assertVisibilityFitsRecipients(visibility, ['u1'])).not.toThrow();
  });

  it.each(['public', 'gm', 'blind', 'self', undefined] as const)('accepts %s without recipients', (visibility) => {
    expect(() => assertVisibilityFitsRecipients(visibility, [])).not.toThrow();
  });

  it('accepts recipients without a visibility', () => {
    expect(() => assertVisibilityFitsRecipients(undefined, ['u1'])).not.toThrow();
  });
});

describe('assertSimulationBudget', () => {
  it('allows exactly the budget', () => {
    expect(() => assertSimulationBudget([100], MAX_SIMULATED_DICE / 100)).not.toThrow();
  });

  it('refuses one die over the budget for the whole run', () => {
    expect(() => assertSimulationBudget([100, 1], 1000)).toThrow(TooManySimulatedDiceError);
    expect(() => assertSimulationBudget([100, 1], 1000)).toThrow(
      'Simulation asks for too many dice (101000 > 100000); lower the iterations'
    );
  });

  it('counts a die whose count is an expression as one', () => {
    expect(() => assertSimulationBudget([null], 1000)).not.toThrow();
  });
});

describe('summarizeTotals', () => {
  it('reports min, max and the mean rounded to two decimals', () => {
    expect(summarizeTotals([3, 8, 4])).toEqual({ min: 3, max: 8, mean: 5 });
    expect(summarizeTotals([1, 2, 2])).toEqual({ min: 1, max: 2, mean: 1.67 });
  });

  it('is all zero for no totals', () => {
    expect(summarizeTotals([])).toEqual({ min: 0, max: 0, mean: 0 });
  });
});

describe('toRollDataSpec', () => {
  const actor = { kind: 'world', actorId: 'a1' } as const;

  it('is null without an actor or values', () => {
    expect(toRollDataSpec(undefined, undefined)).toBeNull();
  });

  it('keeps whichever source is given', () => {
    expect(toRollDataSpec(actor, undefined)).toEqual({ actor, values: undefined });
    expect(toRollDataSpec(undefined, { bonus: 1 })).toEqual({ actor: undefined, values: { bonus: 1 } });
  });
});

describe('error texts', () => {
  it('names every unresolved reference', () => {
    expect(new UnresolvedRollDataError(['@a', '@b.c']).message).toBe(
      'Roll formula references data that is not set: @a, @b.c'
    );
  });

  it('names the recipient that matches no user', () => {
    expect(new WhisperRecipientNotFoundError('Bob').message).toBe('Whisper recipient not found: Bob');
  });
});
