import { getActorSummaryRequestSchema, RequestToCommandMapper } from '../index';
import { formatZodError } from '@/systems/shared/validation';

describe('coc7 get-actor-summary request schema', () => {
  it('requires a target and maps it', () => {
    const neither = getActorSummaryRequestSchema.safeParse({});
    expect(neither.success).toBe(false);
    if (!neither.success) expect(formatZodError(neither.error)).toBe('Either actorId or tokenId is required');
    expect(RequestToCommandMapper.toGetActorSummaryCommand({ tokenId: 't', sceneId: 's' })).toEqual({ target: { actorId: undefined, tokenId: 't', sceneId: 's' } });
  });
});
