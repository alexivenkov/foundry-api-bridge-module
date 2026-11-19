import { runForActor } from '../actorQueue';
import { Pf1DamageGateway } from '@/systems/pf1/damage/infrastructure/Pf1DamageGateway';
import { byActor, makeActor, makeGame } from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('runForActor', () => {
  it('runs tasks for one actor one after another, even when one fails', async () => {
    const actor = makeActor({ id: 'a1' });
    const order: string[] = [];
    const slow = runForActor(actor, async () => {
      order.push('first:start');
      await tick();
      order.push('first:end');
      throw new Error('boom');
    });
    const fast = runForActor(actor, () => {
      order.push('second');
      return Promise.resolve('ok');
    });
    await expect(slow).rejects.toThrow('boom');
    await expect(fast).resolves.toBe('ok');
    expect(order).toEqual(['first:start', 'first:end', 'second']);
  });

  it('keeps separate queues per uuid, so a token actor does not wait on its world actor', async () => {
    const world = { ...makeActor({ id: 'a1' }), uuid: 'Actor.a1' };
    const token = { ...makeActor({ id: 'a1' }), uuid: 'Scene.s1.Token.t1.Actor.a1' };
    const order: string[] = [];
    const blocked = runForActor(world, async () => {
      await tick();
      order.push('world');
    });
    await runForActor(token, () => {
      order.push('token');
      return Promise.resolve();
    });
    await blocked;
    expect(order).toEqual(['token', 'world']);
  });

  it('keeps every hit of concurrent pf1/apply-damage calls (all were lost but one, live)', async () => {
    const actor = makeActor();
    const hp = actor.system.attributes!.hp!;
    // pf1 reads HP, awaits its update, then the document changes: the race the queue prevents.
    actor.applyDamage.mockImplementation(async (value: number) => {
      const next = (hp.value ?? 0) - value;
      await tick();
      hp.value = next;
      return actor;
    });
    const gateway = new Pf1DamageGateway(makeGame({ actors: [actor] }));
    const hit = { value: 1, nonlethal: false, asWounds: false, reduction: undefined, ratio: undefined };

    const outcomes = await Promise.all([1, 2, 3, 4, 5].map(() => gateway.applyDamage(byActor, hit)));

    expect(hp.value).toBe(15);
    expect(outcomes.map((o) => o.after.hp.value)).toEqual([19, 18, 17, 16, 15]);
  });
});
