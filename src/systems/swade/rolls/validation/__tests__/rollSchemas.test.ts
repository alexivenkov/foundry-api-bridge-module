import {
  rollAttributeRequestSchema,
  rollSkillRequestSchema,
  rollAttackRequestSchema,
  rollDamageRequestSchema,
  RequestToCommandMapper
} from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('swade roll request schemas', () => {
  it('accept actorId or tokenId targets', () => {
    expect(rollAttributeRequestSchema.safeParse({ actorId: 'a', attribute: 'vigor' }).success).toBe(true);
    expect(rollSkillRequestSchema.safeParse({ tokenId: 't', sceneId: 's', skill: 'Fighting', unskilled: true }).success).toBe(true);
    expect(rollAttackRequestSchema.safeParse({ tokenId: 't', itemId: 'w', targetTokenId: 'x', targetNumber: 6 }).success).toBe(true);
    expect(rollDamageRequestSchema.safeParse({ actorId: 'a', itemId: 'w', raise: true, modifier: '+1d4', ap: 2 }).success).toBe(true);
  });

  it('reject a missing target with the contract text', () => {
    const result = rollAttributeRequestSchema.safeParse({ attribute: 'vigor' });
    expect(result.success).toBe(false);
    if (!result.success) expect(formatZodError(result.error)).toBe('Either actorId or tokenId is required');
  });

  it('reject an unknown attribute listing the valid ones, and a negative AP', () => {
    const result = rollAttributeRequestSchema.safeParse({ actorId: 'a', attribute: 'luck' });
    expect(result.success).toBe(false);
    if (!result.success) expect(formatZodError(result.error)).toContain('vigor');
    expect(rollDamageRequestSchema.safeParse({ actorId: 'a', itemId: 'w', ap: -1 }).success).toBe(false);
    expect(rollSkillRequestSchema.safeParse({ actorId: 'a', skill: '' }).success).toBe(false);
  });

  it('map requests to commands with the documented defaults', () => {
    expect(RequestToCommandMapper.toRollAttributeCommand({ actorId: 'a', attribute: 'smarts' })).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      attribute: 'smarts',
      modifier: undefined,
      modifierLabel: undefined,
      targetNumber: 4,
      ignoreWounds: false,
      showInChat: false
    });
    expect(RequestToCommandMapper.toRollSkillCommand({ tokenId: 't', skill: 'Notice', targetNumber: 6, unskilled: true, modifier: 1 })).toMatchObject({
      target: { actorId: undefined, tokenId: 't' },
      skill: 'Notice',
      targetNumber: 6,
      unskilled: true,
      modifier: 1
    });
    expect(RequestToCommandMapper.toRollAttackCommand({ actorId: 'a', itemId: 'w' })).toMatchObject({ itemId: 'w', targetTokenId: undefined, targetNumber: undefined, showInChat: false });
    expect(RequestToCommandMapper.toRollDamageCommand({ actorId: 'a', itemId: 'w', raise: true, ap: 1 })).toMatchObject({ itemId: 'w', raise: true, ap: 1, targetTokenId: undefined });
  });
});
