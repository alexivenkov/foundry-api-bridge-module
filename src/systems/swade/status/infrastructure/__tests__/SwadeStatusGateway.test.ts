import { SwadeStatusGateway } from '../SwadeStatusGateway';
import { makeActor, makeGame } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const byActor = { actorId: 'a1', tokenId: undefined, sceneId: undefined };

describe('SwadeStatusGateway', () => {
  it('toggles a status on through the system with active and overlay, and lists the statuses afterwards', async () => {
    const actor = makeActor({ statuses: ['prone'] });
    actor.toggleActiveEffect.mockImplementation(async (id: string) => {
      actor.statuses.add(id);
      if (id === 'stunned') actor.statuses.add('vulnerable');
      return Promise.resolve(true);
    });
    const outcome = await new SwadeStatusGateway(makeGame({ actors: [actor] })).setStatus(byActor, { status: 'stunned', active: true, overlay: true });

    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('stunned', { active: true, overlay: true });
    expect(outcome).toEqual({ actorId: 'a1', status: 'stunned', active: true, statuses: ['prone', 'stunned', 'vulnerable'] });
  });

  it('omits overlay when not given and toggles a status off', async () => {
    const actor = makeActor({ statuses: ['shaken'] });
    const outcome = await new SwadeStatusGateway(makeGame({ actors: [actor] })).setStatus(byActor, { status: 'shaken', active: false, overlay: undefined });

    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('shaken', { active: false });
    expect(outcome).toMatchObject({ active: false, statuses: [] });
  });

  it('does not re-create an already active status nor remove an absent one', async () => {
    const actor = makeActor({ statuses: ['shaken'] });
    const gateway = new SwadeStatusGateway(makeGame({ actors: [actor] }));

    await gateway.setStatus(byActor, { status: 'shaken', active: true, overlay: undefined });
    await gateway.setStatus(byActor, { status: 'prone', active: false, overlay: undefined });

    expect(actor.toggleActiveEffect).not.toHaveBeenCalled();
  });

  it("addresses a token's actor and echoes the token", async () => {
    const goblin = makeActor({ id: 'gob', type: 'npc' });
    const game = makeGame({ tokens: [{ id: 't1', name: 'Goblin', actor: goblin }] });
    const outcome = await new SwadeStatusGateway(game).setStatus({ actorId: undefined, tokenId: 't1', sceneId: undefined }, { status: 'prone', active: true, overlay: undefined });
    expect(outcome).toMatchObject({ actorId: 'gob', tokenId: 't1', statuses: ['prone'] });
  });
});
