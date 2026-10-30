import { applyDamageRequestSchema, RequestToCommandMapper } from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('coc7 apply-damage request schema', () => {
  it('requires exactly one of damage and heal', () => {
    const neither = applyDamageRequestSchema.safeParse({ actorId: 'a' });
    expect(neither.success).toBe(false);
    if (!neither.success) expect(formatZodError(neither.error)).toBe('Either damage or heal is required');
    const both = applyDamageRequestSchema.safeParse({ actorId: 'a', damage: 1, heal: 1 });
    expect(both.success).toBe(false);
    if (!both.success) expect(formatZodError(both.error)).toBe('damage and heal are exclusive');
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', damage: 0 }).success).toBe(false);
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', heal: 2.5 }).success).toBe(false);
  });

  it('maps damage with the armor override and ignoreArmor default', () => {
    expect(RequestToCommandMapper.toApplyDamageCommand({ actorId: 'a', damage: 3, armor: '1d4' })).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      damage: 3,
      heal: undefined,
      ignoreArmor: false,
      armor: '1d4'
    });
    expect(RequestToCommandMapper.toApplyDamageCommand({ tokenId: 't', heal: 4, ignoreArmor: true })).toMatchObject({ heal: 4, ignoreArmor: true });
  });
});
