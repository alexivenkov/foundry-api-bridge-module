import { Coc7DamageGateway } from '../Coc7DamageGateway';
import { byActor, makeActor, makeGame } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

const damage = (amount: number, extra: Partial<{ ignoreArmor: boolean; armor: string | number }> = {}): { damage: number; heal: undefined; ignoreArmor: boolean; armor: string | number | undefined } => ({
  damage: amount,
  heal: undefined,
  ignoreArmor: extra.ignoreArmor ?? false,
  armor: extra.armor
});

describe('Coc7DamageGateway', () => {
  it('deals damage through the system with armor absorbing part of it', async () => {
    const actor = makeActor();
    actor.system.attribs!.armor.value = '2';
    const outcome = await new Coc7DamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, damage(3));
    expect(actor.dealDamage).toHaveBeenCalledWith(3, { armor: null, ignoreArmor: false });
    expect(outcome).toMatchObject({ actorId: 'a1', applied: 1, armorAbsorbed: 2, healed: 0, hpBefore: 11, hpAfter: 10, hpMax: 11, majorWound: false, unconscious: false, dying: false, dead: false });
    expect(outcome.conditions).toMatchObject({ criticalWounds: false, prone: false });
  });

  it('reports a major wound (with the Prone the system adds) at half the maximum', async () => {
    const actor = makeActor();
    const outcome = await new Coc7DamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, damage(6));
    expect(outcome).toMatchObject({ applied: 6, hpAfter: 5, majorWound: true, unconscious: false, conditions: { criticalWounds: true, prone: true } });
  });

  it('reports unconscious and dying at 0 hit points, dead at the maximum', async () => {
    const actor = makeActor();
    const gateway = new Coc7DamageGateway(makeGame({ actors: [actor] }));
    expect(await gateway.applyDamage(byActor, damage(4))).toMatchObject({ hpAfter: 7, majorWound: false, unconscious: false });
    expect(await gateway.applyDamage(byActor, damage(7))).toMatchObject({ hpAfter: 0, majorWound: true, unconscious: true, dying: true, dead: false });
    const fresh = makeActor({ id: 'a2' });
    expect(await new Coc7DamageGateway(makeGame({ actors: [fresh] })).applyDamage({ ...byActor, actorId: 'a2' }, damage(11))).toMatchObject({ hpAfter: 0, dead: true });
  });

  it('passes an armor override and ignoreArmor through', async () => {
    const actor = makeActor();
    const gateway = new Coc7DamageGateway(makeGame({ actors: [actor] }));
    await gateway.applyDamage(byActor, damage(3, { armor: '1d4' }));
    expect(actor.dealDamage).toHaveBeenLastCalledWith(3, { armor: '1d4', ignoreArmor: false });
    const ignored = await gateway.applyDamage(byActor, damage(2, { ignoreArmor: true }));
    expect(actor.dealDamage).toHaveBeenLastCalledWith(2, { armor: null, ignoreArmor: true });
    expect(ignored.armorAbsorbed).toBe(0);
  });

  it('heals through setHp, capped at the maximum', async () => {
    const actor = makeActor();
    actor.system.attribs!.hp.value = 5;
    const outcome = await new Coc7DamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, { damage: undefined, heal: 10, ignoreArmor: false, armor: undefined });
    expect(actor.setHp).toHaveBeenCalledWith(15);
    expect(outcome).toMatchObject({ applied: 0, armorAbsorbed: 0, healed: 6, hpBefore: 5, hpAfter: 11 });
  });

  it('rejects actors without hit points', async () => {
    const gateway = new Coc7DamageGateway(makeGame({ actors: [makeActor({ type: 'vehicle', name: 'Ford' })] }));
    await expect(gateway.applyDamage(byActor, damage(3))).rejects.toThrow('Actor has no hit points: Ford');
  });
});
