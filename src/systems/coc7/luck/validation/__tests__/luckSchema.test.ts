import { luckRequestSchema, RequestToCommandMapper, LUCK_AMOUNT_POSITIVE } from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('coc7 luck request schema', () => {
  it('requires a positive amount for spend and add but allows set 0', () => {
    const spend = luckRequestSchema.safeParse({ actorId: 'a', action: 'spend', amount: 0 });
    expect(spend.success).toBe(false);
    if (!spend.success) expect(formatZodError(spend.error)).toBe(LUCK_AMOUNT_POSITIVE);
    expect(luckRequestSchema.safeParse({ actorId: 'a', action: 'add', amount: 0 }).success).toBe(false);
    expect(luckRequestSchema.safeParse({ actorId: 'a', action: 'set', amount: 0 }).success).toBe(true);
    expect(luckRequestSchema.safeParse({ actorId: 'a', action: 'set', amount: -1 }).success).toBe(false);
    expect(luckRequestSchema.safeParse({ actorId: 'a', action: 'gain', amount: 1 }).success).toBe(false);
  });

  it('maps to a command', () => {
    expect(RequestToCommandMapper.toLuckCommand({ tokenId: 't', action: 'spend', amount: 5 })).toEqual({ target: { actorId: undefined, tokenId: 't', sceneId: undefined }, action: 'spend', amount: 5 });
  });
});
