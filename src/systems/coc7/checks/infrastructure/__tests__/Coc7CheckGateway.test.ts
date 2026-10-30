import { Coc7CheckGateway } from '../Coc7CheckGateway';
import { FakeDiceRoller, byActor, installFakeChatMessage, makeActor, makeGame, makeSkill, uninstallFakeChatMessage } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

const options = { difficulty: undefined, bonusDice: 0, penaltyDice: 0, flatDiceModifier: 0, flatThresholdModifier: 0, blind: false, showInChat: false } as const;

describe('Coc7CheckGateway', () => {
  afterEach(() => {
    uninstallFakeChatMessage();
  });

  describe('rollSkill', () => {
    it('rolls against the skill value and reports the pool, level and push state', async () => {
      const spot = makeSkill({ id: 'sk-spot', name: 'Spot Hidden', value: 45 });
      const actor = makeActor({ items: [spot] });
      const dice = new FakeDiceRoller().queueCheck([5], 2);
      const outcome = await new Coc7CheckGateway(makeGame({ actors: [actor] }), dice).rollSkill(byActor, { skill: 'Spot Hidden', options });
      expect(outcome).toMatchObject({
        actorId: 'a1',
        kind: 'skill',
        name: 'Spot Hidden',
        threshold: 45,
        difficulty: 'regular',
        total: 52,
        outcome: 'failure',
        isSuccess: false,
        canPush: true,
        markedForDevelopment: false,
        luckRequired: { regular: 7, hard: 30, extreme: 43 }
      });
      expect(outcome.tokenId).toBeUndefined();
      expect(outcome.messageId).toBeUndefined();
    });

    it('ticks the skill for development on a rolled success when the world allows it', async () => {
      const spot = makeSkill({ value: 45 });
      const actor = makeActor({ items: [spot] });
      const dice = new FakeDiceRoller().queueCheck([3], 3);
      const outcome = await new Coc7CheckGateway(makeGame({ actors: [actor] }), dice).rollSkill(byActor, { skill: 'sk-spot', options });
      expect(outcome).toMatchObject({ total: 33, outcome: 'regular', isSuccess: true, canPush: false, markedForDevelopment: true });
      expect(spot.update).toHaveBeenCalledWith({ 'system.flags.developement': true });
      expect(spot.system.flags?.developement).toBe(true);
    });

    it.each([
      ['xp disabled', { settings: { xpEnabled: false } }, {}, options],
      ['already ticked', {}, { developement: true }, options],
      ['no xp gain', {}, { noxpgain: true }, options],
      ['blind', {}, {}, { ...options, blind: true }],
      ['unknown difficulty', {}, {}, { ...options, difficulty: 'unknown' as const }],
      ['bonus dice', {}, {}, { ...options, bonusDice: 1 }]
    ])('does not tick when %s', async (_label, gameOptions, skillOptions, checkOptions) => {
      const spot = makeSkill({ value: 45, ...skillOptions });
      const actor = makeActor({ items: [spot] });
      const dice = new FakeDiceRoller().queueCheck(checkOptions.bonusDice > 0 ? [3, 9] : [3], 3);
      const outcome = await new Coc7CheckGateway(makeGame({ actors: [actor], ...gameOptions }), dice).rollSkill(byActor, { skill: 'sk-spot', options: checkOptions });
      expect(outcome.markedForDevelopment).toBe(false);
      expect(spot.update).not.toHaveBeenCalled();
    });

    it('never pushes a fumble, a critical or a skill without the push property', async () => {
      const spot = makeSkill({ value: 45, push: false });
      const actor = makeActor({ items: [spot] });
      const gateway = new Coc7CheckGateway(makeGame({ actors: [actor] }), new FakeDiceRoller().queueCheck([5], 2).queueCheck([10], 10));
      expect((await gateway.rollSkill(byActor, { skill: 'sk-spot', options })).canPush).toBe(false);
      const fumble = await gateway.rollSkill(byActor, { skill: 'sk-spot', options });
      expect(fumble).toMatchObject({ total: 100, isFumble: true, canPush: false });
    });

    it('rejects an unknown skill', async () => {
      const gateway = new Coc7CheckGateway(makeGame({ actors: [makeActor()] }), new FakeDiceRoller());
      await expect(gateway.rollSkill(byActor, { skill: 'Library Use', options })).rejects.toThrow('Skill not found: Library Use');
    });

    it('posts the module card with the development line', async () => {
      const chat = installFakeChatMessage();
      const actor = makeActor({ items: [makeSkill({ value: 45 })] });
      const dice = new FakeDiceRoller().queueCheck([3], 3);
      const outcome = await new Coc7CheckGateway(makeGame({ actors: [actor] }), dice).rollSkill(byActor, { skill: 'sk-spot', options: { ...options, showInChat: true } });
      expect(outcome).toMatchObject({ messageId: 'card-1', markedForDevelopment: true });
      const data = chat.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(data['content']).toContain('Spot Hidden check');
      expect(data['content']).toContain('Regular success');
      expect(data['content']).toContain('Marked for development');
      expect(data['whisper']).toBeUndefined();
      expect((data['rolls'] as unknown[]).length).toBe(2);
    });

    it('whispers a blind card to the GMs and skips the development tick', async () => {
      const chat = installFakeChatMessage();
      const actor = makeActor({ items: [makeSkill({ value: 45 })] });
      const dice = new FakeDiceRoller().queueCheck([3], 3);
      const outcome = await new Coc7CheckGateway(makeGame({ actors: [actor] }), dice).rollSkill(byActor, { skill: 'sk-spot', options: { ...options, showInChat: true, blind: true } });
      expect(outcome).toMatchObject({ messageId: 'card-1', markedForDevelopment: false });
      const data = chat.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(data['content']).not.toContain('Marked for development');
      expect(data['whisper']).toEqual(['gm1']);
      expect(data['blind']).toBe(true);
    });
  });

  describe('rollCharacteristic', () => {
    it('rolls STR, Idea (INT) and Know (EDU)', async () => {
      const actor = makeActor();
      const gateway = new Coc7CheckGateway(makeGame({ actors: [actor] }), new FakeDiceRoller().queueCheck([4], 5).queueCheck([4], 5).queueCheck([9], 9));
      expect(await gateway.rollCharacteristic(byActor, { characteristic: 'str', options })).toMatchObject({ kind: 'characteristic', name: 'STR', threshold: 50, total: 45, isSuccess: true, canPush: false, markedForDevelopment: false });
      expect(await gateway.rollCharacteristic(byActor, { characteristic: 'idea', options })).toMatchObject({ name: 'Idea', threshold: 80, total: 45, outcome: 'regular' });
      expect(await gateway.rollCharacteristic(byActor, { characteristic: 'know', options })).toMatchObject({ name: 'Know', threshold: 75, total: 99, outcome: 'failure', canPush: true });
    });

    it('rejects actors without characteristics', async () => {
      const gateway = new Coc7CheckGateway(makeGame({ actors: [makeActor({ type: 'vehicle', name: 'Ford' })] }), new FakeDiceRoller());
      await expect(gateway.rollCharacteristic(byActor, { characteristic: 'pow', options })).rejects.toThrow('Actor has no characteristics: Ford');
    });
  });

  describe('rollAttribute', () => {
    it('rolls Luck (pushable) and Sanity (never pushable)', async () => {
      const actor = makeActor();
      const gateway = new Coc7CheckGateway(makeGame({ actors: [actor] }), new FakeDiceRoller().queueCheck([7], 7).queueCheck([7], 7));
      expect(await gateway.rollAttribute(byActor, { attribute: 'luck', options })).toMatchObject({ kind: 'attribute', name: 'Luck', threshold: 55, total: 77, isSuccess: false, canPush: true });
      expect(await gateway.rollAttribute(byActor, { attribute: 'sanity', options })).toMatchObject({ name: 'Sanity', threshold: 60, total: 77, isSuccess: false, canPush: false });
    });

    it('rejects actors without the attribute block', async () => {
      const gateway = new Coc7CheckGateway(makeGame({ actors: [makeActor({ type: 'vehicle', name: 'Ford' })] }), new FakeDiceRoller());
      await expect(gateway.rollAttribute(byActor, { attribute: 'luck', options })).rejects.toThrow('Actor has no luck: Ford');
      await expect(gateway.rollAttribute(byActor, { attribute: 'sanity', options })).rejects.toThrow('Actor has no sanity: Ford');
    });

    it("addresses a token's actor and echoes the token", async () => {
      const ghoul = makeActor({ id: 'g1', type: 'creature' });
      const game = makeGame({ tokens: [{ id: 't1', name: 'Ghoul', actor: ghoul }] });
      const outcome = await new Coc7CheckGateway(game, new FakeDiceRoller().queueCheck([1], 1)).rollAttribute({ actorId: undefined, tokenId: 't1', sceneId: undefined }, { attribute: 'sanity', options });
      expect(outcome).toMatchObject({ actorId: 'g1', tokenId: 't1', total: 11 });
    });
  });
});
