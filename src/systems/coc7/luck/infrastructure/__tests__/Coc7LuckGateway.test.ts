import { Coc7LuckGateway } from '../Coc7LuckGateway';
import { byActor, makeActor, makeGame } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

describe('Coc7LuckGateway', () => {
  it('spends, sets (capped at 99) and adds Luck through the system', async () => {
    const actor = makeActor();
    const gateway = new Coc7LuckGateway(makeGame({ actors: [actor] }));
    expect(await gateway.luck(byActor, { action: 'spend', amount: 10 })).toEqual({ actorId: 'a1', action: 'spend', before: 55, after: 45 });
    expect(actor.spendLuck).toHaveBeenCalledWith(10);
    expect(await gateway.luck(byActor, { action: 'add', amount: 60 })).toEqual({ actorId: 'a1', action: 'add', before: 45, after: 99 });
    expect(actor.setLuck).toHaveBeenCalledWith(105);
    expect(await gateway.luck(byActor, { action: 'set', amount: 50 })).toEqual({ actorId: 'a1', action: 'set', before: 99, after: 50 });
  });

  it('refuses to spend more than the actor has', async () => {
    const actor = makeActor();
    const gateway = new Coc7LuckGateway(makeGame({ actors: [actor] }));
    await expect(gateway.luck(byActor, { action: 'spend', amount: 60 })).rejects.toThrow('Not enough Luck: has 55, needs 60');
    expect(actor.system.attribs!.lck.value).toBe(55);
  });

  it('rejects actors without Luck and echoes the token', async () => {
    const ghoul = makeActor({ id: 'g1', type: 'creature' });
    const game = makeGame({ actors: [makeActor({ type: 'vehicle', name: 'Ford' })], tokens: [{ id: 't1', name: 'Ghoul', actor: ghoul }] });
    const gateway = new Coc7LuckGateway(game);
    await expect(gateway.luck(byActor, { action: 'set', amount: 1 })).rejects.toThrow('Actor has no luck: Ford');
    expect(await gateway.luck({ actorId: undefined, tokenId: 't1', sceneId: undefined }, { action: 'spend', amount: 5 })).toEqual({ actorId: 'g1', tokenId: 't1', action: 'spend', before: 55, after: 50 });
  });
});
