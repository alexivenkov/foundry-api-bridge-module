import { rollAttributeRequestSchema, rollCharacteristicRequestSchema, rollSkillRequestSchema, RequestToCommandMapper } from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('coc7 check request schemas', () => {
  it('accepts the three shapes and maps them with default options', () => {
    expect(RequestToCommandMapper.toRollSkillCommand({ actorId: 'a', skill: 'Spot Hidden' })).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      skill: 'Spot Hidden',
      options: { difficulty: undefined, bonusDice: 0, penaltyDice: 0, flatDiceModifier: 0, flatThresholdModifier: 0, blind: false, showInChat: false }
    });
    expect(RequestToCommandMapper.toRollCharacteristicCommand({ tokenId: 't', characteristic: 'idea', difficulty: 'hard' })).toMatchObject({ characteristic: 'idea', options: { difficulty: 'hard' } });
    expect(RequestToCommandMapper.toRollAttributeCommand({ actorId: 'a', attribute: 'luck', bonusDice: 2 })).toMatchObject({ attribute: 'luck', options: { bonusDice: 2 } });
  });

  it('validates enums, the skill text and the exclusive pool dice', () => {
    expect(rollSkillRequestSchema.safeParse({ actorId: 'a', skill: '' }).success).toBe(false);
    expect(rollSkillRequestSchema.safeParse({ actorId: 'a', skill: 'x', bonusDice: 1, penaltyDice: 2 }).success).toBe(false);
    const characteristic = rollCharacteristicRequestSchema.safeParse({ actorId: 'a', characteristic: 'luck' });
    expect(characteristic.success).toBe(false);
    if (!characteristic.success) expect(formatZodError(characteristic.error)).toMatch(/^characteristic: /);
    expect(rollCharacteristicRequestSchema.safeParse({ actorId: 'a', characteristic: 'know' }).success).toBe(true);
    const attribute = rollAttributeRequestSchema.safeParse({ actorId: 'a', attribute: 'san' });
    expect(attribute.success).toBe(false);
    if (!attribute.success) expect(formatZodError(attribute.error)).toContain('"sanity"');
  });
});
