import { Pf1DamageGateway } from '../Pf1DamageGateway';
import { readPf1Health, usesWoundsAndVigor } from '@/systems/pf1/shared/infrastructure';
import type { ApplyDamageOptions } from '@/systems/pf1/damage/domain';
import { byActor, fullSystem, makeActor, makeGame } from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

const hit: ApplyDamageOptions = { value: 7, nonlethal: false, asWounds: false, reduction: undefined, ratio: undefined };

describe('Pf1DamageGateway', () => {
  it('applies damage through the system and answers the health before and after', async () => {
    const system = fullSystem();
    system.attributes!.hp!.temp = 3;
    const actor = makeActor({ system });

    const outcome = await new Pf1DamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, hit);

    expect(actor.applyDamage).toHaveBeenCalledWith(7, { asNonlethal: false, asWounds: false });
    expect(outcome).toEqual({
      actorId: 'a1',
      applied: true,
      before: { hp: { value: 20, max: 28, temp: 3, nonlethal: 0 } },
      after: { hp: { value: 16, max: 28, temp: 0, nonlethal: 0 } }
    });
  });

  it('forwards healing, nonlethal damage, ratio and reduction', async () => {
    const actor = makeActor();
    const gateway = new Pf1DamageGateway(makeGame({ actors: [actor] }));

    await gateway.applyDamage(byActor, { ...hit, value: -5 });
    expect(actor.applyDamage).toHaveBeenLastCalledWith(-5, { asNonlethal: false, asWounds: false });

    const outcome = await gateway.applyDamage(byActor, { ...hit, nonlethal: true, reduction: 5, ratio: 0.5 });
    expect(actor.applyDamage).toHaveBeenLastCalledWith(7, { asNonlethal: true, asWounds: false, reduction: 5, ratio: 0.5 });
    expect(outcome.after.hp.nonlethal).toBe(7);
  });

  it('answers applied: false when the system changed nothing', async () => {
    const actor = makeActor();
    actor.applyDamage.mockResolvedValueOnce(false);
    const outcome = await new Pf1DamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, hit);
    expect(outcome.applied).toBe(false);
    expect(outcome.after).toEqual(outcome.before);
  });

  it('refuses actors without hit points', async () => {
    const gateway = new Pf1DamageGateway(makeGame({ actors: [makeActor({ name: 'Haunt', system: {} })] }));
    await expect(gateway.applyDamage(byActor, hit)).rejects.toThrow('Actor has no hit points: Haunt');
  });

  it('answers applied: false for healing at full hit points (the system update changes nothing)', async () => {
    const system = fullSystem();
    system.attributes!.hp!.value = 28;
    const actor = makeActor({ system });
    actor.applyDamage.mockResolvedValueOnce(undefined);
    const outcome = await new Pf1DamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, { ...hit, value: -4 });
    expect(outcome.applied).toBe(false);
  });

  it('adds Wounds & Vigor only when the system health config enables it for the actor', async () => {
    const system = fullSystem();
    system.attributes!.vigor = { value: 10, max: 15, temp: 2 };
    system.attributes!.wounds = { value: 20, max: 24 };
    const actor = makeActor({ system });
    expect(readPf1Health(actor, false)).not.toHaveProperty('vigor');

    const healthConfig = { getActorConfig: jest.fn().mockReturnValue({ rules: { useWoundsAndVigor: true } }) };
    const game = { ...makeGame({ actors: [actor] }), settings: { get: jest.fn().mockReturnValue(healthConfig) } };
    expect(usesWoundsAndVigor(game, actor)).toBe(true);
    expect(game.settings.get).toHaveBeenCalledWith('pf1', 'healthConfig');
    expect((await new Pf1DamageGateway(game).applyDamage(byActor, hit)).before).toEqual({
      hp: { value: 20, max: 28, temp: 0, nonlethal: 0 },
      vigor: { value: 10, max: 15, temp: 2 },
      wounds: { value: 20, max: 24 }
    });
  });

  it('treats a missing or unregistered health setting as Wounds & Vigor off', () => {
    const actor = makeActor();
    expect(usesWoundsAndVigor(makeGame(), actor)).toBe(false);
    const throwing = { ...makeGame(), settings: { get: () => { throw new Error('not registered'); } } };
    expect(usesWoundsAndVigor(throwing, actor)).toBe(false);
  });
});
