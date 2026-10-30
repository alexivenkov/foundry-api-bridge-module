import { rollAttackRequestSchema, rollDamageRequestSchema, RequestToCommandMapper } from '../index';

describe('coc7 attack request schemas', () => {
  it('maps an attack with its defaults', () => {
    expect(RequestToCommandMapper.toRollAttackCommand({ actorId: 'a', itemId: 'w1' })).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      itemId: 'w1',
      alternativeSkill: false,
      options: { difficulty: undefined, bonusDice: 0, penaltyDice: 0, flatDiceModifier: 0, flatThresholdModifier: 0, blind: false, showInChat: false }
    });
    expect(rollAttackRequestSchema.safeParse({ actorId: 'a', itemId: 'w1', bonusDice: 1, penaltyDice: 1 }).success).toBe(false);
    expect(rollAttackRequestSchema.safeParse({ itemId: 'w1' }).success).toBe(false);
  });

  it('maps a damage roll with its defaults and validates the band and level', () => {
    expect(RequestToCommandMapper.toRollDamageCommand({ tokenId: 't', itemId: 'w1' })).toEqual({
      target: { actorId: undefined, tokenId: 't', sceneId: undefined },
      itemId: 'w1',
      range: 'normal',
      successLevel: 'regular',
      targetTokenId: undefined,
      showInChat: false
    });
    expect(rollDamageRequestSchema.safeParse({ actorId: 'a', itemId: 'w1', range: 'far' }).success).toBe(false);
    expect(rollDamageRequestSchema.safeParse({ actorId: 'a', itemId: 'w1', successLevel: 'critical' }).success).toBe(false);
    expect(rollDamageRequestSchema.safeParse({ actorId: 'a', itemId: 'w1', range: 'extreme', successLevel: 'extreme', targetTokenId: 't2' }).success).toBe(true);
  });
});
