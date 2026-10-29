import { SwadeBenniesGateway } from '../SwadeBenniesGateway';
import { makeActor, makeGame, makeUser } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const byActor = { actorId: 'a1', tokenId: undefined, sceneId: undefined };

describe('SwadeBenniesGateway', () => {
  it('spends, gives and refreshes an actor benny through the system methods', async () => {
    const actor = makeActor({ system: { bennies: { value: 2, max: 3 } } });
    const gateway = new SwadeBenniesGateway(makeGame({ actors: [actor] }));

    expect(await gateway.actorBennies(byActor, 'spend')).toEqual({ owner: 'actor', actorId: 'a1', action: 'spend', before: 2, after: 1, max: 3 });
    expect(actor.spendBenny).toHaveBeenCalledTimes(1);

    expect(await gateway.actorBennies(byActor, 'give')).toMatchObject({ action: 'give', before: 1, after: 2 });
    expect(actor.getBenny).toHaveBeenCalledTimes(1);

    expect(await gateway.actorBennies(byActor, 'refresh')).toMatchObject({ action: 'refresh', before: 2, after: 3 });
    expect(actor.refreshBennies).toHaveBeenCalledWith(true);
  });

  it("prefers the data model's awaitable refreshBennies when the system exposes it", async () => {
    const actor = makeActor({ system: { bennies: { value: 0, max: 2 } } });
    const modelRefresh = jest.fn(async function (this: { bennies?: { value: number; max: number } }) {
      if (this.bennies) this.bennies.value = this.bennies.max;
      return Promise.resolve();
    });
    actor.system.refreshBennies = modelRefresh;

    const outcome = await new SwadeBenniesGateway(makeGame({ actors: [actor] })).actorBennies(byActor, 'refresh');

    expect(modelRefresh).toHaveBeenCalledWith(true);
    expect(actor.refreshBennies).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ before: 0, after: 2 });
  });

  it('refuses to spend from an empty pool and actors without bennies', async () => {
    const broke = makeActor({ id: 'b1', name: 'Broke', system: { bennies: { value: 0, max: 3 } } });
    const jeep = makeActor({ id: 'v1', name: 'Jeep', type: 'vehicle' });
    const gateway = new SwadeBenniesGateway(makeGame({ actors: [broke, jeep] }));

    await expect(gateway.actorBennies({ ...byActor, actorId: 'b1' }, 'spend')).rejects.toThrow('No bennies left: Broke');
    await expect(gateway.actorBennies({ ...byActor, actorId: 'v1' }, 'give')).rejects.toThrow('Actor has no bennies: Jeep');
  });

  it('echoes the token when addressed by tokenId', async () => {
    const goblin = makeActor({ id: 'gob', type: 'npc', wildcard: true });
    const game = makeGame({ tokens: [{ id: 't1', name: 'Goblin', actor: goblin }] });
    const outcome = await new SwadeBenniesGateway(game).actorBennies({ actorId: undefined, tokenId: 't1', sceneId: undefined }, 'give');
    expect(outcome).toMatchObject({ actorId: 'gob', tokenId: 't1', after: 4 });
  });

  it('handles the GM pool on game.user', async () => {
    const user = makeUser({ isGM: true, bennies: 1, refreshTo: 3 });
    const gateway = new SwadeBenniesGateway(makeGame({ user }));

    expect(await gateway.gmBennies('spend')).toEqual({ owner: 'gm', action: 'spend', before: 1, after: 0 });
    await expect(gateway.gmBennies('spend')).rejects.toThrow('No bennies left: GM');
    expect(await gateway.gmBennies('give')).toMatchObject({ before: 0, after: 1 });
    expect(await gateway.gmBennies('refresh')).toMatchObject({ before: 1, after: 3 });
    expect(user.refreshBennies).toHaveBeenCalledWith(true);
  });

  it('refuses the GM pool for a non-GM user', async () => {
    const gateway = new SwadeBenniesGateway(makeGame({ user: makeUser({ isGM: false }) }));
    await expect(gateway.gmBennies('give')).rejects.toThrow('Current user is not a GM');
  });
});
