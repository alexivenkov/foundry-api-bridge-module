import { Coc7SanityGateway, BOUT_TABLE_NOT_CONFIGURED } from '../Coc7SanityGateway';
import { FakeDiceRoller, byActor, installFakeChatMessage, makeActor, makeGame, uninstallFakeChatMessage } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

const base = { lossPassed: 1, lossFailed: '1d6', reason: undefined, difficulty: undefined, bonusDice: 0, penaltyDice: 0, apply: true, showInChat: false } as const;
const resolveTable = jest.fn(async (uuid: string) => Promise.resolve(uuid === 'RollTable.bout' ? { name: 'Bouts' } : null));

describe('Coc7SanityGateway', () => {
  afterEach(() => {
    uninstallFakeChatMessage();
    resolveTable.mockClear();
  });

  describe('sanityCheck', () => {
    it('takes the passed loss on a success without rolling it', async () => {
      const actor = makeActor();
      const dice = new FakeDiceRoller().queueCheck([3], 3);
      const outcome = await new Coc7SanityGateway(makeGame({ actors: [actor] }), dice, resolveTable).sanityCheck(byActor, base);
      expect(outcome).toMatchObject({
        actorId: 'a1',
        roll: { kind: 'attribute', name: 'Sanity', threshold: 60, total: 33, isSuccess: true, canPush: false },
        immune: 'none',
        lossFormula: '1',
        lossRolled: 1,
        lossApplied: 1,
        limitedByReason: false,
        mythosHardened: false,
        applied: true,
        sanBefore: 60,
        sanAfter: 59,
        sanMax: 99,
        dailyLoss: 1,
        dailyLimit: 12,
        temporaryInsanity: false,
        indefiniteInsanity: false,
        permanentInsanity: false,
        luckOfferSkipped: false
      });
      expect(dice.formulaCalls).toEqual([]);
      expect(actor.update).toHaveBeenCalledWith({ 'system.attribs.san.value': 59, 'system.attribs.san.dailyLoss': 1 });
      expect(actor.setReasonSanLoss).not.toHaveBeenCalled();
      expect(actor.conditionsSet).not.toHaveBeenCalled();
    });

    it('rolls the failed loss, records it against the reason and flags Temporary Insanity at 5+', async () => {
      const actor = makeActor();
      const dice = new FakeDiceRoller().queueCheck([7], 7);
      dice.formulaTotals['1d6'] = 5;
      const outcome = await new Coc7SanityGateway(makeGame({ actors: [actor] }), dice, resolveTable).sanityCheck(byActor, { ...base, reason: 'Ghoul' });
      expect(outcome).toMatchObject({ roll: { total: 77, isSuccess: false }, lossFormula: '1d6', lossRolled: 5, lossApplied: 5, sanAfter: 55, dailyLoss: 5, temporaryInsanity: true, indefiniteInsanity: false });
      expect(actor.setReasonSanLoss).toHaveBeenCalledWith('Ghoul', 5);
      expect(actor.conditionsSet).toHaveBeenCalledWith(['tempoInsane']);
      expect(actor.system.sanityLossEvents).toEqual([{ type: 'Ghoul', totalLoss: 5, immunity: false }]);
    });

    it('caps the loss at what the reason can still take and becomes immune afterwards', async () => {
      const actor = makeActor({ system: { sanityLossEvents: [{ type: 'ghoul', totalLoss: 4, immunity: false }] } });
      const dice = new FakeDiceRoller().queueCheck([7], 7).queueCheck([7], 7);
      dice.formulaTotals['1d6'] = 6;
      const gateway = new Coc7SanityGateway(makeGame({ actors: [actor] }), dice, resolveTable);
      const capped = await gateway.sanityCheck(byActor, { ...base, reason: 'Ghoul' });
      expect(capped).toMatchObject({ lossRolled: 6, lossApplied: 2, limitedByReason: true, sanAfter: 58 });
      const immune = await gateway.sanityCheck(byActor, { ...base, reason: 'Ghoul' });
      expect(immune).toMatchObject({ immune: 'reason', lossFormula: '', lossRolled: 0, lossApplied: 0, applied: false, sanAfter: 58, temporaryInsanity: false });
    });

    it('takes the maximum of the failed loss on a fumble', async () => {
      const actor = makeActor();
      const dice = new FakeDiceRoller().queueCheck([10], 10);
      const outcome = await new Coc7SanityGateway(makeGame({ actors: [actor] }), dice, resolveTable).sanityCheck(byActor, base);
      expect(outcome).toMatchObject({ roll: { total: 100, isFumble: true }, lossFormula: '1d6', lossRolled: 6, lossApplied: 6, temporaryInsanity: true });
      expect(dice.formulaCalls).toEqual([{ formula: '1d6', data: {}, maximize: true }]);
    });

    it('loses nothing during a bout of madness', async () => {
      const actor = makeActor();
      actor.system.conditions!.tempoInsane.value = true;
      const outcome = await new Coc7SanityGateway(makeGame({ actors: [actor] }), new FakeDiceRoller().queueCheck([7], 7), resolveTable).sanityCheck(byActor, base);
      expect(outcome).toMatchObject({ immune: 'bout', lossApplied: 0, applied: false, sanAfter: 60 });
      expect(actor.update).not.toHaveBeenCalled();
    });

    it('halves the loss for a Mythos hardened investigator', async () => {
      const actor = makeActor({ mythosHardened: true });
      const dice = new FakeDiceRoller().queueCheck([7], 7);
      dice.formulaTotals['1d6'] = 5;
      const outcome = await new Coc7SanityGateway(makeGame({ actors: [actor] }), dice, resolveTable).sanityCheck(byActor, base);
      expect(outcome).toMatchObject({ lossRolled: 5, lossApplied: 2, mythosHardened: true, temporaryInsanity: false });
    });

    it('flags Indefinite Insanity at the daily limit and permanent insanity at 0 SAN, guarding a 0 limit', async () => {
      const limited = makeActor();
      limited.system.attribs!.san.dailyLoss = 10;
      const dice = new FakeDiceRoller().queueCheck([7], 7);
      dice.formulaTotals['1d6'] = 3;
      const outcome = await new Coc7SanityGateway(makeGame({ actors: [limited] }), dice, resolveTable).sanityCheck(byActor, base);
      expect(outcome).toMatchObject({ dailyLoss: 13, indefiniteInsanity: true });
      expect(limited.conditionsSet).toHaveBeenCalledWith(['indefInsane']);

      const unlimited = makeActor({ id: 'a2' });
      unlimited.system.attribs!.san.dailyLimit = 0;
      unlimited.system.attribs!.san.value = 2;
      const dice2 = new FakeDiceRoller().queueCheck([7], 7);
      dice2.formulaTotals['1d6'] = 3;
      const gone = await new Coc7SanityGateway(makeGame({ actors: [unlimited] }), dice2, resolveTable).sanityCheck({ ...byActor, actorId: 'a2' }, base);
      expect(gone).toMatchObject({ sanAfter: 0, indefiniteInsanity: false, permanentInsanity: true });
      expect(unlimited.conditionsSet).not.toHaveBeenCalledWith(['indefInsane']);
    });

    it('only reports when apply is false and notes the skipped Luck offer under the pulp rule', async () => {
      const actor = makeActor();
      const dice = new FakeDiceRoller().queueCheck([7], 7);
      dice.formulaTotals['1d6'] = 5;
      const outcome = await new Coc7SanityGateway(makeGame({ actors: [actor], settings: { pulpRuleLuckHalfSanityLoss: true } }), dice, resolveTable).sanityCheck(byActor, { ...base, apply: false });
      expect(outcome).toMatchObject({ applied: false, lossApplied: 5, sanBefore: 60, sanAfter: 55, dailyLoss: 0, temporaryInsanity: true, luckOfferSkipped: true });
      expect(actor.update).not.toHaveBeenCalled();
      expect(actor.conditionsSet).not.toHaveBeenCalled();
      expect(actor.system.attribs!.san.value).toBe(60);
    });

    it('rejects actors without Sanity and posts the card with the loss line', async () => {
      const chat = installFakeChatMessage();
      const vehicle = makeActor({ id: 'v1', type: 'vehicle', name: 'Ford' });
      const actor = makeActor();
      const dice = new FakeDiceRoller().queueCheck([7], 7);
      dice.formulaTotals['1d6'] = 4;
      const gateway = new Coc7SanityGateway(makeGame({ actors: [actor, vehicle] }), dice, resolveTable);
      await expect(gateway.sanityCheck({ ...byActor, actorId: 'v1' }, base)).rejects.toThrow('Actor has no sanity: Ford');
      const outcome = await gateway.sanityCheck(byActor, { ...base, showInChat: true });
      expect(outcome.messageId).toBe('card-1');
      const data = chat.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(data['content']).toContain('Sanity check');
      expect(data['content']).toContain('Lost 4 SAN (1d6) → 56');
      expect((data['rolls'] as unknown[]).length).toBe(3);
    });
  });

  describe('boutOfMadness', () => {
    it('rejects an unconfigured or unresolvable table', async () => {
      const actor = makeActor();
      await expect(new Coc7SanityGateway(makeGame({ actors: [actor] }), new FakeDiceRoller(), resolveTable).boutOfMadness(byActor, { realTime: true, duration: 1 })).rejects.toThrow(BOUT_TABLE_NOT_CONFIGURED);
      const game = makeGame({ actors: [actor], settings: { boutOfMadnessRealTimeTable: 'RollTable.missing' } });
      await expect(new Coc7SanityGateway(game, new FakeDiceRoller(), resolveTable).boutOfMadness(byActor, { realTime: true, duration: 1 })).rejects.toThrow(BOUT_TABLE_NOT_CONFIGURED);
      expect(actor.enterBoutOfMadness).not.toHaveBeenCalled();
    });

    it('enters a real-time bout through the system and flattens the description', async () => {
      const actor = makeActor();
      const game = makeGame({ actors: [actor], settings: { boutOfMadnessRealTimeTable: 'RollTable.bout' } });
      const outcome = await new Coc7SanityGateway(game, new FakeDiceRoller(), resolveTable).boutOfMadness(byActor, { realTime: true, duration: 3 });
      expect(actor.enterBoutOfMadness).toHaveBeenCalledWith(true, 3);
      expect(outcome).toEqual({ actorId: 'a1', name: 'Nyctophobia', description: 'Nyctophobia:Fear of the dark.', phobia: true, mania: false, realTime: true, duration: 3, tempoInsane: true });
      expect(actor.system.conditions!.tempoInsane).toEqual({ value: true, realTime: true, duration: 3 });
    });

    it('enters a summary bout without setting Temporary Insanity', async () => {
      const actor = makeActor({ bout: { name: '', phobia: false, mania: false, description: '<p>Wanders off for 1d10 hours</p>' } });
      const game = makeGame({ actors: [actor], settings: { boutOfMadnessSummaryTable: 'RollTable.bout' } });
      const outcome = await new Coc7SanityGateway(game, new FakeDiceRoller(), resolveTable).boutOfMadness(byActor, { realTime: false, duration: 2 });
      expect(outcome).toMatchObject({ name: '', description: 'Wanders off for 1d10 hours', realTime: false, duration: 2, tempoInsane: false });
    });
  });
});
