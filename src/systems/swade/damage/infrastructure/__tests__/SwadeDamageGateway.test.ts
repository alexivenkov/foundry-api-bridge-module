import { SwadeDamageGateway } from '../SwadeDamageGateway';
import { makeActor, makeGame, makeTraitRoll } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const byActor = { actorId: 'a1', tokenId: undefined, sceneId: undefined };
const apply = { damage: 0, ap: 0, isHeavyWeapon: false, apply: true };
const soak = { wounds: 1, spendBenny: true, modifier: undefined, modifierLabel: undefined, clearIncapacitated: false, showInChat: false };

describe('SwadeDamageGateway.applyDamage (Toughness 7, Armor 2, 0/3 Wounds)', () => {
  it('Shakes an unshaken target on a hit without a raise', async () => {
    const actor = makeActor();
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, { ...apply, damage: 9 });

    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('shaken', { active: true });
    expect(actor.update).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      actorId: 'a1',
      applied: true,
      outcome: 'shaken',
      woundsInflicted: 0,
      shakenBefore: false,
      shakenAfter: true,
      woundsBefore: 0,
      woundsAfter: 0,
      woundsMax: 3,
      incapacitated: false,
      canSoak: false
    });
  });

  it('turns a second hit on a Shaken target into a Wound and keeps it Shaken', async () => {
    const actor = makeActor({ statuses: ['shaken'] });
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, { ...apply, damage: 8 });

    expect(actor.toggleActiveEffect).not.toHaveBeenCalled();
    expect(actor.update).toHaveBeenCalledWith({ 'system.wounds.value': 1 });
    expect(outcome).toMatchObject({ outcome: 'wounded', doubleShaken: true, woundsInflicted: 1, shakenBefore: true, shakenAfter: true, woundsAfter: 1, canSoak: true });
  });

  it('applies Wounds alongside Shaken on a raise and respects AP against armor', async () => {
    const actor = makeActor();
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, { ...apply, damage: 14, ap: 4 });

    expect(outcome).toMatchObject({ apApplied: 2, effectiveToughness: 5, excess: 9, outcome: 'wounded', woundsInflicted: 2, shakenAfter: true, woundsAfter: 2 });
    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('shaken', { active: true });
    expect(actor.update).toHaveBeenCalledWith({ 'system.wounds.value': 2 });
  });

  it('incapacitates when the Wounds exceed the maximum and caps the wound value', async () => {
    const actor = makeActor({ system: { wounds: { value: 2, max: 3, ignored: 0 } } });
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, { ...apply, damage: 15 });

    expect(actor.update).toHaveBeenCalledWith({ 'system.wounds.value': 3 });
    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('incapacitated', { active: true });
    expect(outcome).toMatchObject({ woundsInflicted: 2, wouldIncapacitate: true, incapacitated: true, woundsAfter: 3 });
  });

  it('honours the Wound Cap setting', async () => {
    const actor = makeActor();
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor], settings: { woundCap: true } })).applyDamage(byActor, { ...apply, damage: 40 });
    expect(outcome.woundsInflicted).toBe(4);
  });

  it('previews without touching the actor when apply is false', async () => {
    const actor = makeActor();
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).applyDamage(byActor, { ...apply, damage: 14, apply: false });

    expect(actor.toggleActiveEffect).not.toHaveBeenCalled();
    expect(actor.update).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ applied: false, outcome: 'wounded', woundsInflicted: 1, shakenAfter: false, woundsAfter: 0, incapacitated: false, canSoak: false });
  });

  it('wounds a vehicle from its own Toughness without ever Shaking it', async () => {
    const jeep = makeActor({ id: 'v1', type: 'vehicle' });
    const gateway = new SwadeDamageGateway(makeGame({ actors: [jeep] }));

    const shaken = await gateway.applyDamage({ ...byActor, actorId: 'v1' }, { ...apply, damage: 13 });
    expect(shaken).toMatchObject({ toughness: 12, armor: 4, outcome: 'none', woundsInflicted: 0, shakenAfter: false });
    expect(jeep.toggleActiveEffect).not.toHaveBeenCalled();

    const wounded = await gateway.applyDamage({ ...byActor, actorId: 'v1' }, { ...apply, damage: 17, ap: 6 });
    expect(wounded).toMatchObject({ apApplied: 4, outcome: 'wounded', woundsInflicted: 2, shakenAfter: false, woundsAfter: 2, canSoak: false });
    expect(jeep.toggleActiveEffect).not.toHaveBeenCalled();
  });

  it('reads the hardy flag and refuses actors without Toughness', async () => {
    const hardy = makeActor({ statuses: ['shaken'], flags: { hardy: true } });
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [hardy] })).applyDamage(byActor, { ...apply, damage: 8 });
    expect(outcome).toMatchObject({ outcome: 'shaken', woundsInflicted: 0, doubleShaken: false });

    const party = makeActor({ id: 'g1', name: 'Party', type: 'group' });
    await expect(new SwadeDamageGateway(makeGame({ actors: [party] })).applyDamage({ ...byActor, actorId: 'g1' }, apply)).rejects.toThrow('Actor has no Toughness: Party');
  });

  it("addresses one token's actor and echoes the token", async () => {
    const goblin = makeActor({ id: 'gob', type: 'npc', wildcard: false });
    const game = makeGame({ tokens: [{ id: 't3', name: 'Goblin 3', actor: goblin }] });
    const outcome = await new SwadeDamageGateway(game).applyDamage({ actorId: undefined, tokenId: 't3', sceneId: undefined }, { ...apply, damage: 11 });
    expect(outcome).toMatchObject({ actorId: 'gob', tokenId: 't3', woundsInflicted: 1, canSoak: false });
  });
});

describe('SwadeDamageGateway.soak', () => {
  it('spends a benny, rolls Vigor with the soak bonus and removes the soaked Wounds and Shaken', async () => {
    const roll = makeTraitRoll({ dice: [{ faces: 8, results: [8, 1] }] }); // 9 → 2 successes
    const actor = makeActor({ roll, statuses: ['shaken'], system: { wounds: { value: 2, max: 3, ignored: 0 } } });
    const vigor = actor.system.attributes?.vigor;
    if (vigor) vigor.soakBonus = 1;
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).soak(byActor, { ...soak, wounds: 2, modifier: 2, modifierLabel: 'Edge' });

    expect(actor.spendBenny).toHaveBeenCalledTimes(1);
    expect(actor.rollAttribute).toHaveBeenCalledWith('vigor', {
      suppressChat: true,
      isRerollable: false,
      additionalMods: [
        { label: 'Soak bonus', value: 1 },
        { label: 'Edge', value: 2 }
      ]
    });
    const spendOrder = actor.spendBenny.mock.invocationCallOrder[0] ?? Infinity;
    const rollOrder = actor.rollAttribute.mock.invocationCallOrder[0] ?? -Infinity;
    expect(spendOrder).toBeLessThan(rollOrder);
    expect(actor.update).toHaveBeenCalledWith({ 'system.wounds.value': 0 });
    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('shaken', { active: false });
    expect(outcome).toMatchObject({
      actorId: 'a1',
      woundsSoaked: 2,
      woundsRemaining: 0,
      woundsAfter: 0,
      bennySpent: true,
      benniesLeft: 2,
      shakenRemoved: true
    });
    expect(outcome.roll).toMatchObject({ trait: 'vigor', successes: 2 });
  });

  it('keeps the remaining Wounds and Shaken on a partial soak, never below zero', async () => {
    const roll = makeTraitRoll({ dice: [{ faces: 8, results: [5] }] }); // 1 success
    const actor = makeActor({ roll, statuses: ['shaken'], system: { wounds: { value: 1, max: 3, ignored: 0 } } });
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).soak(byActor, { ...soak, wounds: 3 });

    expect(actor.update).toHaveBeenCalledWith({ 'system.wounds.value': 0 });
    expect(actor.toggleActiveEffect).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ woundsSoaked: 1, woundsRemaining: 2, woundsAfter: 0, shakenRemoved: false });
  });

  it('soaks nothing on a failure and leaves the wounds alone', async () => {
    const roll = makeTraitRoll({ dice: [{ faces: 8, results: [2] }] });
    const actor = makeActor({ roll, system: { wounds: { value: 1, max: 3, ignored: 0 } } });
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).soak(byActor, soak);

    expect(actor.update).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ woundsSoaked: 0, woundsRemaining: 1, woundsAfter: 1, bennySpent: true });
  });

  it('can roll without spending a benny and clear Incapacitated on a full soak', async () => {
    const roll = makeTraitRoll({ dice: [{ faces: 8, results: [8, 4] }] });
    const actor = makeActor({ roll, statuses: ['shaken', 'incapacitated'], system: { wounds: { value: 3, max: 3, ignored: 0 } } });
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).soak(byActor, { ...soak, wounds: 1, spendBenny: false, clearIncapacitated: true });

    expect(actor.spendBenny).not.toHaveBeenCalled();
    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('incapacitated', { active: false });
    expect(outcome).toMatchObject({ bennySpent: false, benniesLeft: 3, woundsSoaked: 1, woundsAfter: 2, shakenRemoved: true });
  });

  it('adds the Unarmored Hero bonus when the setting rule is on', async () => {
    const actor = makeActor({ isUnarmored: true });
    await new SwadeDamageGateway(makeGame({ actors: [actor], settings: { unarmoredHero: true } })).soak(byActor, soak);
    expect(actor.rollAttribute.mock.calls[0]?.[1]).toMatchObject({
      additionalMods: [
        { label: 'Soak bonus', value: 0 },
        { label: 'Unarmored Hero', value: 2 }
      ]
    });
  });

  it('refuses Extras and actors out of bennies', async () => {
    const extra = makeActor({ id: 'e1', name: 'Goblin', type: 'npc', wildcard: false });
    const broke = makeActor({ id: 'b1', name: 'Broke', system: { bennies: { value: 0, max: 3 } } });
    const gateway = new SwadeDamageGateway(makeGame({ actors: [extra, broke] }));

    await expect(gateway.soak({ ...byActor, actorId: 'e1' }, soak)).rejects.toThrow('Only Wild Cards can soak: Goblin');
    await expect(gateway.soak({ ...byActor, actorId: 'b1' }, soak)).rejects.toThrow('No bennies left: Broke');
    expect(broke.rollAttribute).not.toHaveBeenCalled();
  });

  it('posts the soak roll when asked', async () => {
    const roll = makeTraitRoll({ messageId: 'soak-1' });
    const actor = makeActor({ roll });
    const outcome = await new SwadeDamageGateway(makeGame({ actors: [actor] })).soak(byActor, { ...soak, showInChat: true });
    expect(roll.toMessage).toHaveBeenCalledWith({ flavor: 'Soak Roll' });
    expect(outcome.roll.messageId).toBe('soak-1');
  });
});
