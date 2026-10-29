import { SwadeRollGateway } from '../SwadeRollGateway';
import { ActorNotFoundError, ItemNotFoundError, RollResolutionError, ValidationError } from '@/systems/shared/domain/errors';
import {
  makeActor,
  makeDamageRoll,
  makeGame,
  makeSkill,
  makeTraitRoll,
  makeWeapon
} from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const byActor = { actorId: 'a1', tokenId: undefined, sceneId: undefined };
const traitOptions = { modifier: undefined, modifierLabel: undefined, targetNumber: 4, ignoreWounds: false, showInChat: false };
const skillOptions = { ...traitOptions, unskilled: false };
const attackOptions = { targetTokenId: undefined, targetNumber: undefined, modifier: undefined, modifierLabel: undefined, showInChat: false };
const damageOptions = { raise: false, modifier: undefined, modifierLabel: undefined, ap: undefined, targetTokenId: undefined, showInChat: false };

describe('SwadeRollGateway', () => {
  describe('rollAttribute', () => {
    it('builds the roll headlessly with the caller modifier and maps the wild die', async () => {
      const roll = makeTraitRoll({
        dice: [
          { faces: 8, results: [6] },
          { faces: 6, results: [6, 1], wild: true }
        ],
        modifiers: [['Modifier', 2]]
      });
      const actor = makeActor({ roll });
      const gateway = new SwadeRollGateway(makeGame({ actors: [actor] }));

      const outcome = await gateway.rollAttribute(byActor, 'vigor', { ...traitOptions, modifier: 2, modifierLabel: 'Aim', targetNumber: 5 });

      expect(actor.rollAttribute).toHaveBeenCalledWith('vigor', {
        suppressChat: true,
        isRerollable: false,
        ignoreWounds: false,
        additionalMods: [{ label: 'Aim', value: 2 }]
      });
      expect(roll.targetNumber).toBe(5);
      expect(outcome).toMatchObject({ trait: 'vigor', total: 9, wildDie: true, successes: 2, outcome: 'raise', raises: 1 });
      expect(outcome.dice[1]).toMatchObject({ wild: true, kept: true, results: [6, 1] });
      expect(outcome.dice[0]).toMatchObject({ wild: false, kept: false });
    });

    it('rolls an Extra without a wild die and passes ignoreWounds', async () => {
      const roll = makeTraitRoll({ dice: [{ faces: 6, results: [4] }] });
      const actor = makeActor({ type: 'npc', wildcard: false, roll });
      const gateway = new SwadeRollGateway(makeGame({ actors: [actor] }));

      const outcome = await gateway.rollAttribute(byActor, 'agility', { ...traitOptions, ignoreWounds: true });

      expect(actor.rollAttribute.mock.calls[0]?.[1]).toMatchObject({ ignoreWounds: true, additionalMods: [] });
      expect(outcome.wildDie).toBe(false);
      expect(outcome.dice).toHaveLength(1);
    });

    it('rejects an unknown attribute, a missing actor, a group and a vehicle without that attribute', async () => {
      const group = makeActor({ id: 'g1', name: 'Party', type: 'group' });
      const vehicle = makeActor({ id: 'v1', name: 'Jeep', type: 'vehicle' });
      const gateway = new SwadeRollGateway(makeGame({ actors: [makeActor(), group, vehicle] }));

      await expect(gateway.rollAttribute(byActor, 'luck', traitOptions)).rejects.toThrow(ValidationError);
      await expect(gateway.rollAttribute({ ...byActor, actorId: 'zz' }, 'vigor', traitOptions)).rejects.toThrow(ActorNotFoundError);
      await expect(gateway.rollAttribute({ ...byActor, actorId: 'g1' }, 'vigor', traitOptions)).rejects.toThrow('Actor has no attributes: Party');
      await expect(gateway.rollAttribute({ ...byActor, actorId: 'v1' }, 'vigor', traitOptions)).rejects.toThrow('Actor has no attributes: Jeep');
    });

    it('lets a vehicle roll an attribute the sheet has enabled', async () => {
      const vehicle = makeActor({ id: 'v1', type: 'vehicle' });
      const vigor = vehicle.system.attributes?.vigor;
      if (vigor) vigor.enabled = true;
      const gateway = new SwadeRollGateway(makeGame({ actors: [vehicle] }));

      await expect(gateway.rollAttribute({ ...byActor, actorId: 'v1' }, 'vigor', traitOptions)).resolves.toMatchObject({ trait: 'vigor' });
    });

    it('surfaces a hook veto and posts to chat on request', async () => {
      const vetoed = makeActor({ roll: null });
      await expect(new SwadeRollGateway(makeGame({ actors: [vetoed] })).rollAttribute(byActor, 'spirit', traitOptions)).rejects.toThrow(
        RollResolutionError
      );

      const roll = makeTraitRoll({ messageId: 'm-7' });
      const actor = makeActor({ roll });
      const outcome = await new SwadeRollGateway(makeGame({ actors: [actor] })).rollAttribute(byActor, 'spirit', { ...traitOptions, showInChat: true });
      expect(roll.toMessage).toHaveBeenCalledWith({ flavor: 'Spirit Attribute Test' });
      expect(outcome.messageId).toBe('m-7');
    });
  });

  describe('rollSkill', () => {
    const fighting = makeSkill({ id: 'sk-fight', name: 'Fighting' });
    const notice = makeSkill({ id: 'sk-notice', name: 'Notice', system: { swid: 'notice' } });

    it('rolls by item id', async () => {
      const actor = makeActor({ items: [fighting, notice] });
      const outcome = await new SwadeRollGateway(makeGame({ actors: [actor] })).rollSkill(byActor, 'sk-notice', skillOptions);

      expect(actor.rollSkill).toHaveBeenCalledWith('sk-notice', { suppressChat: true, isRerollable: false, ignoreWounds: false, additionalMods: [] });
      expect(outcome.trait).toBe('Notice');
    });

    it('rolls by name, case-insensitively, and by swid', async () => {
      const actor = makeActor({ items: [fighting, notice] });
      const gateway = new SwadeRollGateway(makeGame({ actors: [actor] }));

      await gateway.rollSkill(byActor, 'fIGHTING', skillOptions);
      expect(actor.rollSkill).toHaveBeenLastCalledWith('sk-fight', expect.anything());

      await gateway.rollSkill(byActor, 'notice', skillOptions);
      expect(actor.rollSkill).toHaveBeenLastCalledWith('sk-notice', expect.anything());
    });

    it('fails on an unknown skill unless an unskilled attempt is allowed', async () => {
      const actor = makeActor({ items: [fighting] });
      const gateway = new SwadeRollGateway(makeGame({ actors: [actor] }));

      await expect(gateway.rollSkill(byActor, 'Stealth', skillOptions)).rejects.toThrow('Skill not found: Stealth');
      expect(actor.makeUnskilledAttempt).not.toHaveBeenCalled();

      const outcome = await gateway.rollSkill(byActor, 'Stealth', { ...skillOptions, unskilled: true, modifier: -1 });
      expect(actor.makeUnskilledAttempt).toHaveBeenCalledWith({
        suppressChat: true,
        isRerollable: false,
        ignoreWounds: false,
        additionalMods: [{ label: 'Modifier', value: -1 }]
      });
      expect(outcome.trait).toBe('Unskilled');
    });

    it('refuses vehicles and groups', async () => {
      const vehicle = makeActor({ id: 'v1', name: 'Jeep', type: 'vehicle' });
      await expect(new SwadeRollGateway(makeGame({ actors: [vehicle] })).rollSkill({ ...byActor, actorId: 'v1' }, 'Driving', skillOptions)).rejects.toThrow(
        'Only Extras and Wild Cards can roll skills: Jeep'
      );
    });
  });

  describe('rollAttack', () => {
    const fighting = makeSkill({ id: 'sk-fight', name: 'Fighting' });

    it('resolves the skill from the weapon trait, passes the weapon and the trait modifier, and flags the hit', async () => {
      const weapon = makeWeapon({ system: { actions: { trait: 'fighting', traitMod: '+1', dmgMod: '' }, ap: 2, range: '', isMelee: true } });
      const roll = makeTraitRoll({ dice: [{ faces: 8, results: [5] }], modifiers: [['Trait modifier', 1]] });
      const actor = makeActor({ items: [fighting, weapon], roll });
      const gateway = new SwadeRollGateway(makeGame({ actors: [actor] }));

      const outcome = await gateway.rollAttack(byActor, 'w1', { ...attackOptions, modifier: -2, modifierLabel: 'Called shot' });

      expect(actor.rollSkill).toHaveBeenCalledWith('sk-fight', {
        suppressChat: true,
        isRerollable: false,
        item: weapon,
        additionalMods: [
          { label: 'Trait modifier', value: '+1' },
          { label: 'Called shot', value: -2 }
        ]
      });
      expect(outcome).toMatchObject({
        trait: 'Fighting',
        total: 6,
        targetNumber: 4,
        hit: true,
        weapon: { id: 'w1', name: 'Longsword', damage: '@str+d8', ap: 2, range: '', isMelee: true }
      });
      expect(outcome.target).toBeUndefined();
    });

    it("uses the target's Parry as the target number for a melee attack", async () => {
      const weapon = makeWeapon();
      const roll = makeTraitRoll({ dice: [{ faces: 8, results: [5] }] });
      const attacker = makeActor({ items: [fighting, weapon], roll });
      const goblin = makeActor({ id: 'gob', name: 'Goblin', type: 'npc', system: { stats: { toughness: { value: 5, armor: 0 }, parry: { value: 6 }, size: 0 } } });
      const game = makeGame({ actors: [attacker], tokens: [{ id: 't-gob', name: 'Goblin 2', actor: goblin }] });

      const outcome = await new SwadeRollGateway(game).rollAttack(byActor, 'w1', { ...attackOptions, targetTokenId: 't-gob' });

      expect(roll.targetNumber).toBe(6);
      expect(outcome).toMatchObject({ targetNumber: 6, hit: false, successes: 0, target: { tokenId: 't-gob', actorId: 'gob', name: 'Goblin 2', parry: 6 } });
    });

    it('keeps TN 4 for a ranged attack on a target and honours an explicit target number', async () => {
      const bow = makeWeapon({ id: 'bow', name: 'Bow', system: { actions: { trait: 'Shooting', traitMod: '', dmgMod: '' }, isMelee: false, isRanged: true, range: '12/24/48' } });
      const shooting = makeSkill({ id: 'sk-shoot', name: 'Shooting' });
      const attacker = makeActor({ items: [shooting, bow] });
      const goblin = makeActor({ id: 'gob', type: 'npc' });
      const game = makeGame({ actors: [attacker], tokens: [{ id: 't-gob', name: 'Goblin', actor: goblin }] });
      const gateway = new SwadeRollGateway(game);

      expect((await gateway.rollAttack(byActor, 'bow', { ...attackOptions, targetTokenId: 't-gob' })).targetNumber).toBe(4);
      expect((await gateway.rollAttack(byActor, 'bow', { ...attackOptions, targetTokenId: 't-gob', targetNumber: 8 })).targetNumber).toBe(8);
    });

    it('makes an unskilled attempt when the weapon names no skill the actor has', async () => {
      const weapon = makeWeapon({ system: { actions: { trait: 'Athletics', traitMod: '', dmgMod: '' } } });
      const actor = makeActor({ items: [weapon] });
      const outcome = await new SwadeRollGateway(makeGame({ actors: [actor] })).rollAttack(byActor, 'w1', attackOptions);

      expect(actor.makeUnskilledAttempt).toHaveBeenCalledWith(expect.objectContaining({ item: weapon }));
      expect(outcome.trait).toBe('Unskilled');
    });

    it('rejects a missing item, a non-weapon and an unknown target token', async () => {
      const actor = makeActor({ items: [fighting, makeWeapon()] });
      const gateway = new SwadeRollGateway(makeGame({ actors: [actor] }));

      await expect(gateway.rollAttack(byActor, 'nope', attackOptions)).rejects.toThrow(ItemNotFoundError);
      await expect(gateway.rollAttack(byActor, 'sk-fight', attackOptions)).rejects.toThrow('Item is not a weapon: sk-fight');
      await expect(gateway.rollAttack(byActor, 'w1', { ...attackOptions, targetTokenId: 'zz' })).rejects.toThrow('Target token not found: zz');
    });
  });

  describe('rollDamage', () => {
    it('rolls the weapon damage headlessly, adds the raise die and the damage modifier, and reports AP', async () => {
      const damageRoll = makeDamageRoll({ dice: [{ faces: 8, results: [6] }, { faces: 6, results: [6, 3] }], total: 17, formula: '1d8x + 1d6x + 2' });
      const weapon = makeWeapon({ damageRoll, system: { ap: 2, actions: { trait: 'Fighting', traitMod: '', dmgMod: '+2' }, bonusDamageDice: 2, bonusDamageDie: 8 } });
      const actor = makeActor({ items: [weapon] });
      const outcome = await new SwadeRollGateway(makeGame({ actors: [actor] })).rollDamage(byActor, 'w1', { ...damageOptions, raise: true, modifier: '+1d4', modifierLabel: 'Smite' });

      expect(weapon.rollDamage).toHaveBeenCalledWith({
        suppressChat: true,
        isRerollable: false,
        additionalMods: [
          { label: 'Damage modifier', value: '+2' },
          { label: 'Raise', value: '+2d8x' },
          { label: 'Smite', value: '+1d4' }
        ]
      });
      expect(damageRoll.evaluate).toHaveBeenCalledWith({ allowInteractive: false });
      expect(outcome).toMatchObject({
        actorId: 'a1',
        weapon: { id: 'w1', name: 'Longsword' },
        total: 17,
        formula: '1d8x + 1d6x + 2',
        ap: 2,
        isHeavyWeapon: false,
        raiseDamageIncluded: true
      });
      expect(outcome.dice).toEqual([
        { type: 'd8', results: [6], total: 6, wild: false, kept: true },
        { type: 'd6', results: [6, 3], total: 9, wild: false, kept: true }
      ]);
      expect(outcome.versusTarget).toBeUndefined();
    });

    it('overrides AP, adds the actor global AP bonus and previews the damage against a target without applying it', async () => {
      const damageRoll = makeDamageRoll({ total: 11 });
      const weapon = makeWeapon({ damageRoll, system: { ap: 1, isHeavyWeapon: true } });
      const actor = makeActor({ items: [weapon], system: { stats: { toughness: { value: 7, armor: 2 }, parry: { value: 6 }, size: 0, globalMods: { ap: [{ label: 'Edge', value: 1 }] } } } });
      const goblin = makeActor({ id: 'gob', type: 'npc', system: { stats: { toughness: { value: 6, armor: 2 }, parry: { value: 5 }, size: 0 } } });
      const game = makeGame({ actors: [actor], tokens: [{ id: 't-gob', name: 'Goblin', actor: goblin }], settings: { woundCap: true } });

      const outcome = await new SwadeRollGateway(game).rollDamage(byActor, 'w1', { ...damageOptions, ap: 3, targetTokenId: 't-gob' });

      expect(weapon.rollDamage).toHaveBeenCalledWith(expect.objectContaining({ ap: 3 }));
      expect(outcome.ap).toBe(4);
      expect(outcome.isHeavyWeapon).toBe(true);
      expect(outcome.versusTarget).toEqual({
        toughness: 6,
        armor: 2,
        apApplied: 2,
        effectiveToughness: 4,
        excess: 7,
        outcome: 'wounded',
        woundsInflicted: 1,
        doubleShaken: false,
        wouldIncapacitate: false
      });
      expect(goblin.update).not.toHaveBeenCalled();
      expect(goblin.toggleActiveEffect).not.toHaveBeenCalled();
    });

    it('posts the damage card with the AP flavor when asked', async () => {
      const damageRoll = makeDamageRoll({ messageId: 'dmg-9' });
      const weapon = makeWeapon({ damageRoll, system: { ap: 2 } });
      const actor = makeActor({ items: [weapon] });
      const outcome = await new SwadeRollGateway(makeGame({ actors: [actor] })).rollDamage(byActor, 'w1', { ...damageOptions, showInChat: true });

      expect(damageRoll.toMessage).toHaveBeenCalledWith({ flavor: 'Longsword Damage - AP 2' });
      expect(outcome.messageId).toBe('dmg-9');
    });

    it('rejects a weapon without damage, a cancelled roll, a missing item and a non-weapon', async () => {
      const silent = makeWeapon({ id: 'fists', system: { damage: '' } });
      const vetoed = makeWeapon({ id: 'veto', damageRoll: null });
      const actor = makeActor({ items: [silent, vetoed, makeSkill()] });
      const gateway = new SwadeRollGateway(makeGame({ actors: [actor] }));

      await expect(gateway.rollDamage(byActor, 'fists', damageOptions)).rejects.toThrow('Weapon has no damage: fists');
      await expect(gateway.rollDamage(byActor, 'veto', damageOptions)).rejects.toThrow('Roll was cancelled by a module hook');
      await expect(gateway.rollDamage(byActor, 'zz', damageOptions)).rejects.toThrow('Item not found: zz');
      await expect(gateway.rollDamage(byActor, 's1', damageOptions)).rejects.toThrow('Item is not a weapon: s1');
    });
  });
});
