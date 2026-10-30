import { boutOfMadnessRequestSchema, sanityCheckRequestSchema, RequestToCommandMapper } from '../index';

describe('coc7 sanity request schemas', () => {
  it('maps a sanity check with its defaults', () => {
    expect(RequestToCommandMapper.toSanityCheckCommand({ actorId: 'a', lossPassed: 0, lossFailed: '1d6' })).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      lossPassed: 0,
      lossFailed: '1d6',
      reason: undefined,
      difficulty: undefined,
      bonusDice: 0,
      penaltyDice: 0,
      apply: true,
      showInChat: false
    });
    expect(RequestToCommandMapper.toSanityCheckCommand({ tokenId: 't', lossPassed: '1', lossFailed: '1d10', reason: 'Ghoul', difficulty: 'hard', penaltyDice: 1, apply: false })).toMatchObject({ reason: 'Ghoul', difficulty: 'hard', penaltyDice: 1, apply: false });
  });

  it('validates the loss formulas and the pool dice', () => {
    expect(sanityCheckRequestSchema.safeParse({ actorId: 'a', lossPassed: '', lossFailed: '1d6' }).success).toBe(false);
    expect(sanityCheckRequestSchema.safeParse({ actorId: 'a', lossPassed: -1, lossFailed: '1d6' }).success).toBe(false);
    expect(sanityCheckRequestSchema.safeParse({ actorId: 'a', lossFailed: '1d6' }).success).toBe(false);
    expect(sanityCheckRequestSchema.safeParse({ actorId: 'a', lossPassed: 1, lossFailed: '1d6', bonusDice: 1, penaltyDice: 1 }).success).toBe(false);
  });

  it('maps a bout of madness with its defaults', () => {
    expect(RequestToCommandMapper.toBoutOfMadnessCommand({ actorId: 'a' })).toEqual({ target: { actorId: 'a', tokenId: undefined, sceneId: undefined }, realTime: true, duration: 1 });
    expect(RequestToCommandMapper.toBoutOfMadnessCommand({ actorId: 'a', realTime: false, duration: 4 })).toMatchObject({ realTime: false, duration: 4 });
    expect(boutOfMadnessRequestSchema.safeParse({ actorId: 'a', duration: 0 }).success).toBe(false);
  });
});
