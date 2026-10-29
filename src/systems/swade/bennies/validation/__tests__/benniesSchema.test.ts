import { benniesRequestSchema, RequestToCommandMapper, EXACTLY_ONE_OWNER, GM_IS_EXCLUSIVE } from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('swade bennies request schema', () => {
  it('accepts an actor, a token or the GM as the owner', () => {
    expect(benniesRequestSchema.safeParse({ actorId: 'a', action: 'spend' }).success).toBe(true);
    expect(benniesRequestSchema.safeParse({ tokenId: 't', action: 'give' }).success).toBe(true);
    expect(benniesRequestSchema.safeParse({ gm: true, action: 'refresh' }).success).toBe(true);
  });

  it('requires exactly one owner and a known action', () => {
    const none = benniesRequestSchema.safeParse({ action: 'spend' });
    expect(none.success).toBe(false);
    if (!none.success) expect(formatZodError(none.error)).toBe(EXACTLY_ONE_OWNER);

    const both = benniesRequestSchema.safeParse({ gm: true, actorId: 'a', action: 'spend' });
    expect(both.success).toBe(false);
    if (!both.success) expect(formatZodError(both.error)).toBe(GM_IS_EXCLUSIVE);

    expect(benniesRequestSchema.safeParse({ actorId: 'a', action: 'steal' }).success).toBe(false);
    expect(benniesRequestSchema.safeParse({ gm: false, actorId: 'a', action: 'spend' }).success).toBe(false);
  });

  it('maps the GM owner to an undefined target', () => {
    expect(RequestToCommandMapper.toBenniesCommand({ gm: true, action: 'give' })).toEqual({ target: undefined, action: 'give' });
    expect(RequestToCommandMapper.toBenniesCommand({ tokenId: 't', action: 'spend' })).toEqual({
      target: { actorId: undefined, tokenId: 't', sceneId: undefined },
      action: 'spend'
    });
  });
});
