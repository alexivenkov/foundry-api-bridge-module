import { Pf1ConditionGateway } from '../Pf1ConditionGateway';
import { byActor, makeActor, makeGame, makeRegistry } from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

describe('Pf1ConditionGateway', () => {
  it('sets a condition through setConditions and answers every active condition', async () => {
    const actor = makeActor({ statuses: ['prone'] });
    const outcome = await new Pf1ConditionGateway(makeGame({ actors: [actor] }), makeRegistry()).setCondition(byActor, 'Shaken', true);
    expect(actor.setConditions).toHaveBeenCalledWith({ shaken: true });
    expect(outcome).toEqual({ actorId: 'a1', condition: 'shaken', active: true, changed: true, conditions: ['shaken', 'prone'] });
  });

  it('reports an unchanged condition and a removal', async () => {
    const actor = makeActor({ statuses: ['prone'] });
    const gateway = new Pf1ConditionGateway(makeGame({ actors: [actor] }), makeRegistry());
    expect(await gateway.setCondition(byActor, 'prone', true)).toMatchObject({ active: true, changed: false });
    expect(await gateway.setCondition(byActor, 'prone', false)).toMatchObject({ active: false, changed: true, conditions: [] });
  });

  it('shows immunity as a condition that stayed off', async () => {
    const golem = makeActor({ name: 'Golem' });
    const outcome = await new Pf1ConditionGateway(makeGame({ actors: [golem] }), makeRegistry()).setCondition(byActor, 'paralyzed', true);
    expect(outcome).toMatchObject({ condition: 'paralyzed', active: false, changed: false });
  });

  it('refuses unknown conditions before touching the actor', async () => {
    const actor = makeActor();
    const gateway = new Pf1ConditionGateway(makeGame({ actors: [actor] }), makeRegistry());
    await expect(gateway.setCondition(byActor, 'sleepy', true)).rejects.toThrow('Unknown PF1 condition: sleepy');
    expect(actor.setConditions).not.toHaveBeenCalled();
  });
});
