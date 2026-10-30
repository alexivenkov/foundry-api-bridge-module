import { z } from 'zod';
import { formatZodError } from '@/systems/shared/validation';
import { coc7ActorTargetShape, coc7CheckOptionsShape, hasActorOrToken, poolDiceExclusive, poolDiceRefinement, targetRefinement, toActorTarget, toCheckOptions } from '../index';

const schema = z.object({ ...coc7ActorTargetShape, ...coc7CheckOptionsShape }).refine(hasActorOrToken, targetRefinement).refine(poolDiceExclusive, poolDiceRefinement);

describe('coc7 shared schemas', () => {
  it('requires a target and refuses bonus with penalty dice', () => {
    const neither = schema.safeParse({});
    expect(neither.success).toBe(false);
    if (!neither.success) expect(formatZodError(neither.error)).toBe('Either actorId or tokenId is required');
    const both = schema.safeParse({ actorId: 'a', bonusDice: 1, penaltyDice: 1 });
    expect(both.success).toBe(false);
    if (!both.success) expect(formatZodError(both.error)).toBe('bonusDice and penaltyDice are exclusive');
    expect(schema.safeParse({ actorId: 'a', bonusDice: 2, penaltyDice: 0 }).success).toBe(true);
  });

  it('bounds the pool dice and the difficulty', () => {
    expect(schema.safeParse({ actorId: 'a', bonusDice: 3 }).success).toBe(false);
    expect(schema.safeParse({ actorId: 'a', penaltyDice: -1 }).success).toBe(false);
    expect(schema.safeParse({ actorId: 'a', difficulty: 'impossible' }).success).toBe(false);
    expect(schema.safeParse({ actorId: 'a', flatDiceModifier: 1.5 }).success).toBe(false);
  });

  it('maps the target and fills the option defaults', () => {
    expect(toActorTarget({ tokenId: 't', sceneId: 's' })).toEqual({ actorId: undefined, tokenId: 't', sceneId: 's' });
    expect(toCheckOptions({})).toEqual({ difficulty: undefined, bonusDice: 0, penaltyDice: 0, flatDiceModifier: 0, flatThresholdModifier: 0, blind: false, showInChat: false });
    expect(toCheckOptions({ difficulty: 'hard', penaltyDice: 1, flatThresholdModifier: -10, blind: true, showInChat: true })).toMatchObject({ difficulty: 'hard', penaltyDice: 1, flatThresholdModifier: -10, blind: true, showInChat: true });
  });
});
