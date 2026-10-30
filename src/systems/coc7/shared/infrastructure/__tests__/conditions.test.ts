import { readCoc7Conditions, readCoc7Statuses, settleConditionCleared } from '../conditions';
import { makeActor, makeStatus } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

describe('coc7 conditions helpers', () => {
  it('unions the sheet flags with the status effects', () => {
    const actor = makeActor({ effects: ['prone'] });
    actor.system.conditions!.dying.value = true;
    expect(readCoc7Conditions(actor)).toEqual({
      criticalWounds: false,
      unconscious: false,
      dying: true,
      dead: false,
      prone: true,
      tempoInsane: false,
      indefInsane: false
    });
  });

  it('lists phobias and manias', () => {
    const actor = makeActor({ items: [makeStatus({ id: 'st-1', name: 'Nyctophobia' }), makeStatus({ id: 'st-2', name: 'Kleptomania', phobia: false, mania: true })] });
    expect(readCoc7Statuses(actor)).toEqual([
      { id: 'st-1', name: 'Nyctophobia', phobia: true, mania: false },
      { id: 'st-2', name: 'Kleptomania', phobia: false, mania: true }
    ]);
  });

  it('returns at once when the condition is already clear and waits for a late flag otherwise', async () => {
    const actor = makeActor();
    await expect(settleConditionCleared(actor, 'prone')).resolves.toBeUndefined();
    actor.system.conditions!.prone.value = true;
    setTimeout(() => {
      actor.system.conditions!.prone.value = false;
    }, 60);
    const started = Date.now();
    await settleConditionCleared(actor, 'prone');
    expect(Date.now() - started).toBeGreaterThanOrEqual(45);
    expect(actor.hasConditionStatus('prone')).toBe(false);
  });
});
