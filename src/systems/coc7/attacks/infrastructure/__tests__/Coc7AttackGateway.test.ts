import { Coc7AttackGateway } from '../Coc7AttackGateway';
import { FakeDiceRoller, byActor, installFakeChatMessage, makeActor, makeGame, makeSkill, makeWeapon, uninstallFakeChatMessage } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

const options = { difficulty: undefined, bonusDice: 0, penaltyDice: 0, flatDiceModifier: 0, flatThresholdModifier: 0, blind: false, showInChat: false } as const;

describe('Coc7AttackGateway', () => {
  afterEach(() => {
    uninstallFakeChatMessage();
  });

  const brawl = makeSkill({ id: 'sk-brawl', name: 'Fighting (Brawl)', skillName: 'Brawl', value: 50, push: false });
  const handgun = makeSkill({ id: 'sk-handgun', name: 'Firearms (Handgun)', skillName: 'Handgun', value: 40, push: false });
  const smg = makeSkill({ id: 'sk-smg', name: 'Firearms (Submachine Gun)', skillName: 'Submachine Gun', value: 30, push: false });

  describe('rollAttack', () => {
    it("rolls the weapon's main skill, applies the damage bonus to the formulas and flags impale", async () => {
      const knife = makeWeapon({ id: 'w-knife', name: 'Knife', skillMain: brawl, damage: '1d4', properties: { impl: true, addb: true } });
      const actor = makeActor({ items: [brawl, knife] });
      const dice = new FakeDiceRoller().queueCheck([10], 5);
      const outcome = await new Coc7AttackGateway(makeGame({ actors: [actor] }), dice).rollAttack(byActor, { itemId: 'Knife', alternativeSkill: false, options });
      expect(outcome).toMatchObject({
        kind: 'weapon',
        name: 'Fighting (Brawl)',
        threshold: 50,
        total: 5,
        outcome: 'extreme',
        impale: true,
        isMalfunction: false,
        canPush: false,
        markedForDevelopment: false,
        weapon: { id: 'w-knife', name: 'Knife', skill: { id: 'sk-brawl', name: 'Fighting (Brawl)', value: 50 }, ranged: false, impaling: true, damage: { normal: '1d4+1d4' } }
      });
      expect(outcome.weapon.malfunction).toBeUndefined();
      expect(outcome.weapon.damage.long).toBeUndefined();
    });

    it('reports a malfunction at the threshold and the alternative skill for bursts', async () => {
      const gun = makeWeapon({ id: 'w-smg', name: 'Thompson', skillMain: handgun, skillAlternative: smg, damage: '1d10+2', longDamage: '1d6', malfunction: 96, properties: { rngd: true, brst: true } });
      const actor = makeActor({ items: [handgun, smg, gun] });
      const dice = new FakeDiceRoller().queueCheck([9], 7).queueCheck([2], 2);
      const gateway = new Coc7AttackGateway(makeGame({ actors: [actor] }), dice);
      const burst = await gateway.rollAttack(byActor, { itemId: 'w-smg', alternativeSkill: true, options });
      expect(burst).toMatchObject({ name: 'Firearms (Submachine Gun)', threshold: 30, total: 97, outcome: 'fumble', isMalfunction: true, impale: false });
      expect(burst.weapon).toMatchObject({ skill: { id: 'sk-smg', value: 30 }, ranged: true, malfunction: 96, damage: { normal: '1d10+2', long: '1d6' } });
      const single = await gateway.rollAttack(byActor, { itemId: 'w-smg', alternativeSkill: false, options });
      expect(single).toMatchObject({ name: 'Firearms (Handgun)', threshold: 40, total: 22, isMalfunction: false });
    });

    it('rejects a weapon without a skill, a non-weapon and an unknown weapon', async () => {
      const bare = makeWeapon({ id: 'w-bare', name: 'Club', skillMain: undefined });
      const actor = makeActor({ items: [brawl, bare] });
      const gateway = new Coc7AttackGateway(makeGame({ actors: [actor] }), new FakeDiceRoller());
      await expect(gateway.rollAttack(byActor, { itemId: 'w-bare', alternativeSkill: false, options })).rejects.toThrow('Weapon has no skill: Club');
      await expect(gateway.rollAttack(byActor, { itemId: 'sk-brawl', alternativeSkill: false, options })).rejects.toThrow('Item is not a weapon: Fighting (Brawl)');
      await expect(gateway.rollAttack(byActor, { itemId: 'Shotgun', alternativeSkill: false, options })).rejects.toThrow('Weapon not found: Shotgun');
    });

    it('posts the attack card with the malfunction and impale lines', async () => {
      const chat = installFakeChatMessage();
      const knife = makeWeapon({ id: 'w-knife', name: 'Knife', skillMain: brawl, malfunction: 100, properties: { impl: true } });
      const actor = makeActor({ items: [brawl, knife] });
      const outcome = await new Coc7AttackGateway(makeGame({ actors: [actor] }), new FakeDiceRoller().queueCheck([10], 1)).rollAttack(byActor, { itemId: 'w-knife', alternativeSkill: false, options: { ...options, showInChat: true } });
      expect(outcome.messageId).toBe('card-1');
      const data = chat.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(data['content']).toContain('Attack: Knife');
      expect(data['content']).toContain('Impale');
      expect(data['content']).not.toContain('Malfunction');
    });
  });

  describe('rollDamage', () => {
    it('rolls the band formula with the full damage bonus', async () => {
      const knife = makeWeapon({ id: 'w-knife', name: 'Knife', skillMain: brawl, damage: '1d4', properties: { impl: true, addb: true } });
      const actor = makeActor({ items: [brawl, knife] });
      const dice = new FakeDiceRoller();
      dice.formulaTotals['1d4+1d4'] = 5;
      const outcome = await new Coc7AttackGateway(makeGame({ actors: [actor] }), dice).rollDamage(byActor, { itemId: 'w-knife', range: 'normal', successLevel: 'regular', targetTokenId: undefined, showInChat: false });
      expect(outcome).toEqual({
        actorId: 'a1',
        weapon: { id: 'w-knife', name: 'Knife' },
        range: 'normal',
        formula: '1d4+1d4',
        damageBonus: '+1d4',
        impale: false,
        maximized: false,
        dice: [{ formula: '1d4+1d4', results: [5], total: 5 }],
        total: 5
      });
    });

    it('maximizes an extreme success and adds a normal roll for impaling weapons', async () => {
      const knife = makeWeapon({ id: 'w-knife', name: 'Knife', skillMain: brawl, damage: '1d4+2', properties: { impl: true, ahdb: true } });
      const club = makeWeapon({ id: 'w-club', name: 'Club', skillMain: brawl, damage: '1d6', properties: { addb: true } });
      const actor = makeActor({ items: [brawl, knife, club] });
      const dice = new FakeDiceRoller();
      dice.formulaTotals['1d4+2+8'] = 11;
      const gateway = new Coc7AttackGateway(makeGame({ actors: [actor] }), dice);
      const impale = await gateway.rollDamage(byActor, { itemId: 'w-knife', range: 'normal', successLevel: 'extreme', targetTokenId: undefined, showInChat: false });
      expect(impale).toMatchObject({ formula: '1d4+2+8', damageBonus: '+1D2', impale: true, maximized: true, total: 11 });
      expect(dice.formulaCalls.map((call) => [call.formula, call.maximize])).toEqual([
        ['1d4+2+1D2', true],
        ['1d4+2+8', false]
      ]);
      const maxed = await gateway.rollDamage(byActor, { itemId: 'w-club', range: 'normal', successLevel: 'extreme', targetTokenId: undefined, showInChat: false });
      expect(maxed).toMatchObject({ formula: '1d6+1d4', impale: false, maximized: true, total: 10 });
    });

    it('rejects a band without damage', async () => {
      const knife = makeWeapon({ id: 'w-knife', skillMain: brawl, damage: '1d4' });
      const gateway = new Coc7AttackGateway(makeGame({ actors: [makeActor({ items: [brawl, knife] })] }), new FakeDiceRoller());
      await expect(gateway.rollDamage(byActor, { itemId: 'w-knife', range: 'long', successLevel: 'regular', targetTokenId: undefined, showInChat: false })).rejects.toThrow('Weapon has no damage for range: long');
    });

    it("previews against a target's armor, numeric or rolled from a formula", async () => {
      const club = makeWeapon({ id: 'w-club', name: 'Club', skillMain: brawl, damage: '1d6' });
      const actor = makeActor({ items: [brawl, club] });
      const armored = makeActor({ id: 'g1', name: 'Ghoul', type: 'creature', system: { attribs: { ...makeActor().system.attribs!, armor: { value: '2' } } } });
      const hide = makeActor({ id: 'g2', name: 'Shoggoth', type: 'creature', system: { attribs: { ...makeActor().system.attribs!, armor: { value: '1d4' } } } });
      const game = makeGame({ actors: [actor], tokens: [{ id: 't1', name: 'Ghoul', actor: armored }, { id: 't2', name: 'Shoggoth', actor: hide }] });
      const dice = new FakeDiceRoller();
      dice.formulaTotals['1d6'] = 5;
      dice.formulaTotals['1d4'] = 3;
      const gateway = new Coc7AttackGateway(game, dice);
      const numeric = await gateway.rollDamage(byActor, { itemId: 'w-club', range: 'normal', successLevel: 'regular', targetTokenId: 't1', showInChat: false });
      expect(numeric.versusTarget).toEqual({ tokenId: 't1', name: 'Ghoul', armor: 2, wouldInflict: 3 });
      const formula = await gateway.rollDamage(byActor, { itemId: 'w-club', range: 'normal', successLevel: 'regular', targetTokenId: 't2', showInChat: false });
      expect(formula.versusTarget).toEqual({ tokenId: 't2', name: 'Shoggoth', armor: 3, armorFormula: '1d4', wouldInflict: 2 });
      expect(dice.formulaCalls[2]).toMatchObject({ formula: '1d4', data: { str: 50, STR: 50 }, maximize: false });
      await expect(gateway.rollDamage(byActor, { itemId: 'w-club', range: 'normal', successLevel: 'regular', targetTokenId: 't9', showInChat: false })).rejects.toThrow('Target token not found: t9');
    });

    it('posts the Foundry roll with the weapon flavor when asked', async () => {
      installFakeChatMessage();
      const club = makeWeapon({ id: 'w-club', name: 'Club', skillMain: brawl, damage: '1d6' });
      const actor = makeActor({ items: [brawl, club] });
      const dice = new FakeDiceRoller();
      const outcome = await new Coc7AttackGateway(makeGame({ actors: [actor] }), dice).rollDamage(byActor, { itemId: 'w-club', range: 'normal', successLevel: 'regular', targetTokenId: undefined, showInChat: true });
      expect(outcome.messageId).toBe('roll-msg-1');
    });
  });
});
