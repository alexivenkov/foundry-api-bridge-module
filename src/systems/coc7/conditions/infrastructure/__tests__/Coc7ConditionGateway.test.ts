import { Coc7ConditionGateway } from '../Coc7ConditionGateway';
import { byActor, makeActor, makeGame, makeStatus } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

describe('Coc7ConditionGateway', () => {
  it('sets a condition through the system and answers all seven plus the statuses', async () => {
    const actor = makeActor({ items: [makeStatus({ id: 'st-1', name: 'Nyctophobia' })] });
    const outcome = await new Coc7ConditionGateway(makeGame({ actors: [actor] })).setCondition(byActor, { condition: 'prone', active: true, realTime: undefined, duration: undefined });
    expect(actor.conditionsSet).toHaveBeenCalledWith(['prone'], {});
    expect(outcome).toEqual({
      actorId: 'a1',
      conditions: { criticalWounds: false, unconscious: false, dying: false, dead: false, prone: true, tempoInsane: false, indefInsane: false },
      statuses: [{ id: 'st-1', name: 'Nyctophobia', phobia: true, mania: false }]
    });
  });

  it('passes realTime and duration for Temporary Insanity', async () => {
    const actor = makeActor();
    await new Coc7ConditionGateway(makeGame({ actors: [actor] })).setCondition(byActor, { condition: 'tempoInsane', active: true, realTime: false, duration: 2 });
    expect(actor.conditionsSet).toHaveBeenCalledWith(['tempoInsane'], { realTime: false, duration: 2 });
    expect(actor.system.conditions!.tempoInsane).toEqual({ value: true, realTime: false, duration: 2 });
  });

  it('unsets a condition and waits for the flag to clear', async () => {
    const actor = makeActor({ effects: [] });
    actor.system.conditions!.prone.value = true;
    const outcome = await new Coc7ConditionGateway(makeGame({ actors: [actor] })).setCondition(byActor, { condition: 'prone', active: false, realTime: undefined, duration: undefined });
    expect(actor.conditionsUnset).toHaveBeenCalledWith(['prone']);
    expect(outcome.conditions.prone).toBe(false);
  });

  it('counts a status effect the system created before the flag landed', async () => {
    const actor = makeActor({ effects: ['dying'] });
    const outcome = await new Coc7ConditionGateway(makeGame({ actors: [actor] })).setCondition(byActor, { condition: 'prone', active: true, realTime: undefined, duration: undefined });
    expect(outcome.conditions).toMatchObject({ prone: true, dying: true });
  });

  it('rejects actors without conditions', async () => {
    const gateway = new Coc7ConditionGateway(makeGame({ actors: [makeActor({ type: 'vehicle', name: 'Ford' })] }));
    await expect(gateway.setCondition(byActor, { condition: 'prone', active: true, realTime: undefined, duration: undefined })).rejects.toThrow('Actor has no conditions: Ford');
  });
});
