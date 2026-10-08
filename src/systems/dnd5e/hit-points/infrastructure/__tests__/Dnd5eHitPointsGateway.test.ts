import { Dnd5eHitPointsGateway } from '../Dnd5eHitPointsGateway';
import type { FoundryHitPointsGame } from '../foundryHitPointsTypes';

function actorWith(hp: { value: number; max: number; temp: number | null }) {
  const actor = {
    id: 'a1',
    name: 'Goblin',
    system: { attributes: { hp } },
    applyDamage: jest.fn()
  };
  // dnd5e mutates the actor in place; emulate temp HP soaking damage first.
  actor.applyDamage.mockImplementation(async (damages: Array<{ value: number; type?: string }>) => {
    for (const d of damages) {
      if (d.type === 'healing') {
        hp.value = Math.min(hp.max, hp.value + d.value);
        continue;
      }
      const temp = hp.temp ?? 0;
      const fromTemp = Math.min(temp, d.value);
      hp.temp = temp - fromTemp;
      hp.value = Math.max(0, hp.value - (d.value - fromTemp));
    }
  });
  return actor;
}

function gameWith(actor: unknown, token?: unknown): FoundryHitPointsGame {
  const scene = { id: 's1', tokens: { get: jest.fn().mockReturnValue(token) } };
  return {
    actors: { get: jest.fn().mockReturnValue(actor) },
    scenes: { get: jest.fn(), active: scene }
  } as unknown as FoundryHitPointsGame;
}

const byActor = { actorId: 'a1', tokenId: undefined, sceneId: undefined };
const byToken = { actorId: undefined, tokenId: 't1', sceneId: undefined };

describe('Dnd5eHitPointsGateway', () => {
  it('applies typed damage through Actor5e#applyDamage and reports HP before and after', async () => {
    const actor = actorWith({ value: 20, max: 20, temp: 5 });
    const outcome = await new Dnd5eHitPointsGateway(gameWith(actor)).applyDamage(byActor, 8, 'slashing');

    expect(actor.applyDamage).toHaveBeenCalledWith([{ value: 8, type: 'slashing' }]);
    expect(outcome).toEqual({ actorId: 'a1', hpBefore: 20, hpAfter: 17, tempBefore: 5, tempAfter: 0, maxHp: 20 });
  });

  it('omits the damage type when none is given', async () => {
    const actor = actorWith({ value: 10, max: 10, temp: null });
    await new Dnd5eHitPointsGateway(gameWith(actor)).applyDamage(byActor, 3, undefined);

    expect(actor.applyDamage.mock.calls[0]?.[0]).toStrictEqual([{ value: 3 }]);
  });

  it('heals with the healing damage type', async () => {
    const actor = actorWith({ value: 4, max: 20, temp: null });
    const outcome = await new Dnd5eHitPointsGateway(gameWith(actor)).applyHealing(byActor, 10);

    expect(actor.applyDamage).toHaveBeenCalledWith([{ value: 10, type: 'healing' }]);
    expect(outcome.hpBefore).toBe(4);
    expect(outcome.hpAfter).toBe(14);
  });

  it('addresses one token\'s actor by tokenId and echoes the token', async () => {
    const tokenActor = actorWith({ value: 7, max: 7, temp: null });
    const game = gameWith(undefined, { id: 't1', actor: tokenActor });
    const outcome = await new Dnd5eHitPointsGateway(game).applyDamage(byToken, 2, 'piercing');

    expect(game.actors.get).not.toHaveBeenCalled();
    expect(outcome.tokenId).toBe('t1');
    expect(outcome.hpAfter).toBe(5);
  });

  it('fails clearly on a missing actor, token, scene or hit points', async () => {
    const gateway = new Dnd5eHitPointsGateway(gameWith(undefined, undefined));
    await expect(gateway.applyDamage(byActor, 1, undefined)).rejects.toThrow('Actor not found: a1');
    await expect(gateway.applyDamage(byToken, 1, undefined)).rejects.toThrow('Target token not found: t1');
    await expect(gateway.applyDamage({ ...byToken, sceneId: 'zz' }, 1, undefined)).rejects.toThrow('Scene not found: zz');
    await expect(gateway.applyDamage({ actorId: undefined, tokenId: undefined, sceneId: undefined }, 1, undefined))
      .rejects.toThrow('Either actorId or tokenId is required');

    const noHp = { id: 'a1', name: 'Group', system: {}, applyDamage: jest.fn() };
    await expect(new Dnd5eHitPointsGateway(gameWith(noHp)).applyDamage(byActor, 1, undefined))
      .rejects.toThrow('Actor has no hit points: Group');
  });
});
