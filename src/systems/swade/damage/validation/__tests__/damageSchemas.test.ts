import { applyDamageRequestSchema, soakRequestSchema, RequestToCommandMapper } from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('swade damage request schemas', () => {
  it('accept a target with damage and optional AP, and wounds for soak', () => {
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', damage: 9 }).success).toBe(true);
    expect(applyDamageRequestSchema.safeParse({ tokenId: 't', damage: 0, ap: 2, isHeavyWeapon: true, apply: false }).success).toBe(true);
    expect(soakRequestSchema.safeParse({ actorId: 'a', wounds: 1 }).success).toBe(true);
  });

  it('reject a missing target, negative damage, non-integer AP and zero wounds', () => {
    const neither = applyDamageRequestSchema.safeParse({ damage: 5 });
    expect(neither.success).toBe(false);
    if (!neither.success) expect(formatZodError(neither.error)).toBe('Either actorId or tokenId is required');
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', damage: -1 }).success).toBe(false);
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', damage: 5, ap: 1.5 }).success).toBe(false);
    expect(soakRequestSchema.safeParse({ actorId: 'a', wounds: 0 }).success).toBe(false);
  });

  it('map requests to commands with the defaults', () => {
    expect(RequestToCommandMapper.toApplyDamageCommand({ actorId: 'a', damage: 9 })).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      damage: 9,
      ap: 0,
      isHeavyWeapon: false,
      apply: true
    });
    expect(RequestToCommandMapper.toSoakCommand({ tokenId: 't', wounds: 2, spendBenny: false, modifier: 1 })).toEqual({
      target: { actorId: undefined, tokenId: 't', sceneId: undefined },
      wounds: 2,
      spendBenny: false,
      modifier: 1,
      modifierLabel: undefined,
      clearIncapacitated: false,
      showInChat: false
    });
  });
});
