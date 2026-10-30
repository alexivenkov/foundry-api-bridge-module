import { makeActor, makeSkill } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';
import { installCoc7World, queueCheck, formulaTotals, uninstallCoc7World } from './coc7HandlerTestSupport';
import { coc7ApplyDamageHandler } from '../Coc7ApplyDamageHandler';
import { coc7SanityCheckHandler } from '../Coc7SanityCheckHandler';
import { coc7BoutOfMadnessHandler } from '../Coc7BoutOfMadnessHandler';
import { coc7LuckHandler } from '../Coc7LuckHandler';
import { coc7GetActorSummaryHandler } from '../Coc7GetActorSummaryHandler';
import { coc7RollSkillHandler } from '../Coc7RollSkillHandler';
import { coc7RollCharacteristicHandler } from '../Coc7RollCharacteristicHandler';
import { coc7RollAttributeHandler } from '../Coc7RollAttributeHandler';
import { coc7RollAttackHandler } from '../Coc7RollAttackHandler';
import { coc7RollDamageHandler } from '../Coc7RollDamageHandler';
import { coc7SetConditionHandler } from '@/commands/handlers/condition/Coc7SetConditionHandler';

describe('coc7 actor handlers', () => {
  let actor = makeActor();

  beforeEach(() => {
    actor = makeActor({ items: [makeSkill({ id: 'sk-cr', name: 'Credit Rating', value: 30, cocid: 'i.skill.credit-rating' })] });
    installCoc7World({ actors: [actor], settings: { boutOfMadnessRealTimeTable: 'RollTable.bout' } });
    (globalThis as Record<string, unknown>)['fromUuid'] = jest.fn(async (uuid: string) => Promise.resolve(uuid === 'RollTable.bout' ? { name: 'Bouts' } : null));
  });

  afterEach(() => {
    uninstallCoc7World();
  });

  it('coc7/apply-damage deals and heals through the system', async () => {
    const hit = await coc7ApplyDamageHandler({ actorId: 'a1', damage: 6 });
    expect(hit).toEqual({
      actorId: 'a1',
      applied: 6,
      armorAbsorbed: 0,
      healed: 0,
      hpBefore: 11,
      hpAfter: 5,
      hpMax: 11,
      majorWound: true,
      unconscious: false,
      dying: false,
      dead: false,
      conditions: { criticalWounds: true, unconscious: false, dying: false, dead: false, prone: true, tempoInsane: false, indefInsane: false }
    });
    const heal = await coc7ApplyDamageHandler({ actorId: 'a1', heal: 20 });
    expect(heal).toMatchObject({ healed: 6, hpBefore: 5, hpAfter: 11 });
    await expect(coc7ApplyDamageHandler({ actorId: 'a1' })).rejects.toThrow('Either damage or heal is required');
    await expect(coc7ApplyDamageHandler({ actorId: 'a1', damage: 1, heal: 1 })).rejects.toThrow('damage and heal are exclusive');
  });

  it('coc7/sanity-check rolls, applies the loss and answers the wire result', async () => {
    queueCheck([7], 7);
    formulaTotals['1d6'] = 5;
    const result = await coc7SanityCheckHandler({ actorId: 'a1', lossPassed: 1, lossFailed: '1d6', reason: 'Ghoul' });
    expect(result).toMatchObject({
      actorId: 'a1',
      roll: { kind: 'attribute', name: 'Sanity', threshold: 60, total: 77, isSuccess: false },
      immune: 'none',
      lossFormula: '1d6',
      lossRolled: 5,
      lossApplied: 5,
      limitedByReason: false,
      applied: true,
      sanBefore: 60,
      sanAfter: 55,
      dailyLoss: 5,
      dailyLimit: 12,
      temporaryInsanity: true,
      indefiniteInsanity: false,
      permanentInsanity: false,
      luckOfferSkipped: false
    });
    expect(result.roll.tokenId).toBeUndefined();
    expect(actor.system.attribs?.san.value).toBe(55);
    expect(actor.hasTempoInsane).toBe(true);
  });

  it('coc7/bout-of-madness enters the bout once the table resolves', async () => {
    const result = await coc7BoutOfMadnessHandler({ actorId: 'a1', duration: 2 });
    expect(result).toEqual({ actorId: 'a1', name: 'Nyctophobia', description: 'Nyctophobia:Fear of the dark.', phobia: true, mania: false, realTime: true, duration: 2, tempoInsane: true });
    await expect(coc7BoutOfMadnessHandler({ actorId: 'a1', realTime: false })).rejects.toThrow('Bout of Madness table is not configured');
  });

  it('coc7/luck spends, sets and refuses overspending', async () => {
    expect(await coc7LuckHandler({ actorId: 'a1', action: 'spend', amount: 10 })).toEqual({ actorId: 'a1', action: 'spend', before: 55, after: 45 });
    await expect(coc7LuckHandler({ actorId: 'a1', action: 'spend', amount: 90 })).rejects.toThrow('Not enough Luck: has 45, needs 90');
    expect(await coc7LuckHandler({ actorId: 'a1', action: 'set', amount: 50 })).toMatchObject({ after: 50 });
    await expect(coc7LuckHandler({ actorId: 'a1', action: 'add', amount: 0 })).rejects.toThrow('amount must be at least 1 for spend and add');
  });

  it('coc7/get-actor-summary answers the normalized sheet', async () => {
    const summary = await coc7GetActorSummaryHandler({ actorId: 'a1' });
    expect(summary).toMatchObject({ id: 'a1', type: 'character', creditRating: 30, attributes: { hp: { value: 11, max: 11 }, luck: 55 } });
    expect(summary.characteristics).toHaveLength(8);
    expect(summary.skills.map((skill) => skill.name)).toEqual(['Credit Rating']);
    expect(summary.vehicle).toBeUndefined();
  });

  it.each([
    ['coc7/roll-skill', (): Promise<unknown> => coc7RollSkillHandler({ actorId: 'a1', skill: 'x' })],
    ['coc7/roll-characteristic', (): Promise<unknown> => coc7RollCharacteristicHandler({ actorId: 'a1', characteristic: 'str' })],
    ['coc7/roll-attribute', (): Promise<unknown> => coc7RollAttributeHandler({ actorId: 'a1', attribute: 'luck' })],
    ['coc7/roll-attack', (): Promise<unknown> => coc7RollAttackHandler({ actorId: 'a1', itemId: 'x' })],
    ['coc7/roll-damage', (): Promise<unknown> => coc7RollDamageHandler({ actorId: 'a1', itemId: 'x' })],
    ['coc7/apply-damage', (): Promise<unknown> => coc7ApplyDamageHandler({ actorId: 'a1', damage: 1 })],
    ['coc7/sanity-check', (): Promise<unknown> => coc7SanityCheckHandler({ actorId: 'a1', lossPassed: 0, lossFailed: 1 })],
    ['coc7/bout-of-madness', (): Promise<unknown> => coc7BoutOfMadnessHandler({ actorId: 'a1' })],
    ['coc7/luck', (): Promise<unknown> => coc7LuckHandler({ actorId: 'a1', action: 'set', amount: 1 })],
    ['coc7/set-condition', (): Promise<unknown> => coc7SetConditionHandler({ actorId: 'a1', condition: 'prone', active: true })],
    ['coc7/get-actor-summary', (): Promise<unknown> => coc7GetActorSummaryHandler({ actorId: 'a1' })]
  ])('%s refuses a dnd5e world', async (command, call) => {
    installCoc7World({ systemId: 'dnd5e', actors: [actor] });
    await expect(call()).rejects.toThrow(`Operation '${command}' is not supported by game system 'dnd5e'`);
  });
});
