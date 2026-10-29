import { setStatusRequestSchema, RequestToCommandMapper } from '../index';
import { SWADE_STATUS_IDS } from '@/systems/swade/status/domain';
import { formatZodError } from '@/systems/shared/validation';

describe('swade set-status request schema', () => {
  it('accepts every known status id', () => {
    for (const status of SWADE_STATUS_IDS) {
      expect(setStatusRequestSchema.safeParse({ actorId: 'a', status, active: true }).success).toBe(true);
    }
    expect(SWADE_STATUS_IDS).toHaveLength(32);
  });

  it('rejects an unknown id with the list of valid ones', () => {
    const result = setStatusRequestSchema.safeParse({ actorId: 'a', status: 'dazed', active: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = formatZodError(result.error);
      expect(message).toMatch(/^status: /);
      expect(message).toContain('"shaken"');
      expect(message).toContain('"protection"');
    }
  });

  it('requires active and a target', () => {
    expect(setStatusRequestSchema.safeParse({ actorId: 'a', status: 'shaken' }).success).toBe(false);
    const neither = setStatusRequestSchema.safeParse({ status: 'shaken', active: true });
    expect(neither.success).toBe(false);
    if (!neither.success) expect(formatZodError(neither.error)).toBe('Either actorId or tokenId is required');
  });

  it('maps to a command keeping overlay undefined when absent', () => {
    expect(RequestToCommandMapper.toSetStatusCommand({ tokenId: 't', status: 'bound', active: true })).toEqual({
      target: { actorId: undefined, tokenId: 't', sceneId: undefined },
      status: 'bound',
      active: true,
      overlay: undefined
    });
  });
});
