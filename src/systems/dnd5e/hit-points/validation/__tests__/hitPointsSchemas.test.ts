import { applyDamageRequestSchema, applyHealingRequestSchema, RequestToCommandMapper } from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('hit-points request schemas', () => {
  it('accept actorId or tokenId and a non-negative amount', () => {
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', amount: 5 }).success).toBe(true);
    expect(applyDamageRequestSchema.safeParse({ tokenId: 't', amount: 0, type: 'fire' }).success).toBe(true);
    expect(applyHealingRequestSchema.safeParse({ tokenId: 't', sceneId: 's', amount: 2 }).success).toBe(true);
  });

  it('reject a missing target and a negative or non-numeric amount', () => {
    const neither = applyDamageRequestSchema.safeParse({ amount: 5 });
    expect(neither.success).toBe(false);
    if (!neither.success) expect(formatZodError(neither.error)).toBe('Either actorId or tokenId is required');
    expect(applyDamageRequestSchema.safeParse({ actorId: 'a', amount: -1 }).success).toBe(false);
    expect(applyHealingRequestSchema.safeParse({ actorId: 'a', amount: '3' }).success).toBe(false);
  });

  it('maps requests to commands', () => {
    expect(RequestToCommandMapper.toApplyDamageCommand({ tokenId: 't', amount: 4, type: 'cold' })).toEqual({
      actorId: undefined, tokenId: 't', sceneId: undefined, amount: 4, damageType: 'cold'
    });
    expect(RequestToCommandMapper.toApplyHealingCommand({ actorId: 'a', amount: 9 })).toEqual({
      actorId: 'a', tokenId: undefined, sceneId: undefined, amount: 9
    });
  });
});
