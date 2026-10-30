import { setConditionRequestSchema, RequestToCommandMapper } from '../index';
import { COC7_CONDITION_IDS } from '@/systems/coc7/shared/domain';
import { formatZodError } from '@/systems/shared/validation';

describe('coc7 set-condition request schema', () => {
  it('accepts the seven ids and rejects others with the list', () => {
    for (const condition of COC7_CONDITION_IDS) {
      expect(setConditionRequestSchema.safeParse({ actorId: 'a', condition, active: true }).success).toBe(true);
    }
    expect(COC7_CONDITION_IDS).toHaveLength(7);
    const result = setConditionRequestSchema.safeParse({ actorId: 'a', condition: 'shaken', active: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = formatZodError(result.error);
      expect(message).toMatch(/^condition: /);
      expect(message).toContain('"tempoInsane"');
    }
  });

  it('requires active and maps realTime / duration through', () => {
    expect(setConditionRequestSchema.safeParse({ actorId: 'a', condition: 'prone' }).success).toBe(false);
    expect(RequestToCommandMapper.toSetConditionCommand({ actorId: 'a', condition: 'tempoInsane', active: true, realTime: false, duration: 2 })).toEqual({
      target: { actorId: 'a', tokenId: undefined, sceneId: undefined },
      condition: 'tempoInsane',
      active: true,
      realTime: false,
      duration: 2
    });
  });
});
