import {
  chatAttack,
  d20RollData,
  damageRollData,
  liveRoll,
  makeActor,
  makeGame,
  makeItem,
  makeRegistry
} from '@/systems/pf1/shared/__tests__/pf1TestFixtures';
import { pf1RollAbilityHandler } from '../Pf1RollAbilityHandler';
import { pf1RollSkillHandler } from '../Pf1RollSkillHandler';
import { pf1RollSaveHandler } from '../Pf1RollSaveHandler';
import { pf1RollCasterLevelHandler } from '../Pf1RollCasterLevelHandler';
import { pf1RollConcentrationHandler } from '../Pf1RollConcentrationHandler';
import { pf1ApplyDamageHandler } from '../Pf1ApplyDamageHandler';
import { pf1GetActorSummaryHandler } from '../Pf1GetActorSummaryHandler';
import { pf1UseItemHandler } from '@/commands/handlers/item-use/Pf1UseItemHandler';
import { pf1SetConditionHandler } from '@/commands/handlers/condition/Pf1SetConditionHandler';

type Globals = Record<string, unknown>;

describe('pf1 handlers', () => {
  const bow = makeItem({ id: 'bow', name: 'Longbow' });
  let actor = makeActor({ items: [bow] });

  function install(systemId = 'pf1'): void {
    actor = makeActor({ items: [bow] });
    (globalThis as Globals)['game'] = { ...makeGame({ actors: [actor] }), system: { id: systemId } };
    (globalThis as Globals)['pf1'] = { registry: makeRegistry() };
  }

  beforeEach(() => install());

  afterEach(() => {
    delete (globalThis as Globals)['game'];
    delete (globalThis as Globals)['pf1'];
  });

  it('refuses every pf1/* command in another system', async () => {
    install('dnd5e');
    const calls: [string, () => Promise<unknown>][] = [
      ['pf1/roll-ability', () => pf1RollAbilityHandler({ actorId: 'a1', ability: 'str' })],
      ['pf1/roll-skill', () => pf1RollSkillHandler({ actorId: 'a1', skill: 'per' })],
      ['pf1/roll-save', () => pf1RollSaveHandler({ actorId: 'a1', save: 'fort' })],
      ['pf1/roll-caster-level', () => pf1RollCasterLevelHandler({ actorId: 'a1' })],
      ['pf1/roll-concentration', () => pf1RollConcentrationHandler({ actorId: 'a1' })],
      ['pf1/use-item', () => pf1UseItemHandler({ actorId: 'a1', item: 'bow' })],
      ['pf1/apply-damage', () => pf1ApplyDamageHandler({ actorId: 'a1', damage: 1 })],
      ['pf1/set-condition', () => pf1SetConditionHandler({ actorId: 'a1', condition: 'prone', active: true })],
      ['pf1/get-actor-summary', () => pf1GetActorSummaryHandler({ actorId: 'a1' })]
    ];
    for (const [operation, call] of calls) {
      await expect(call()).rejects.toThrow(`Operation '${operation}' is not supported by game system 'dnd5e'`);
    }
    expect(actor.applyDamage).not.toHaveBeenCalled();
  });

  it('reports invalid params with the field name', async () => {
    await expect(pf1RollSaveHandler({ actorId: 'a1', save: 'luck' as 'fort' })).rejects.toThrow(/^save: /);
    await expect(pf1ApplyDamageHandler({ actorId: 'a1' })).rejects.toThrow('Exactly one of damage or heal is required');
  });

  it('pf1/roll-save answers the wire check result', async () => {
    const result = await pf1RollSaveHandler({ actorId: 'a1', save: 'ref', dc: 15 });
    expect(result).toEqual({
      actorId: 'a1',
      kind: 'save',
      id: 'ref',
      name: 'Reflex',
      total: 17,
      formula: '1d20 + 5',
      dice: [{ type: 'd20', count: 1, results: [12] }],
      natural: 12,
      isStatic: false,
      isNat20: false,
      isNat1: false,
      dc: 15,
      isSuccess: true
    });
  });

  it('pf1/roll-skill, roll-ability, roll-caster-level and roll-concentration reach the actor', async () => {
    expect((await pf1RollSkillHandler({ actorId: 'a1', skill: 'Craft (Alchemy)' })).id).toBe('crf.alchemy');
    expect((await pf1RollAbilityHandler({ actorId: 'a1', ability: 'cha' })).name).toBe('Charisma');
    expect((await pf1RollCasterLevelHandler({ actorId: 'a1' })).kind).toBe('caster-level');
    expect((await pf1RollConcentrationHandler({ actorId: 'a1', spellbook: 'primary' })).kind).toBe('concentration');
  });

  it('pf1/use-item answers the attacks', async () => {
    bow.use.mockResolvedValueOnce({
      shared: {
        chatAttacks: [
          chatAttack({
            attack: liveRoll(d20RollData([16], 7)),
            damage: { total: 7, rolls: [liveRoll(damageRollData(8, [5], 2, ['piercing']))] }
          })
        ]
      }
    });
    const result = await pf1UseItemHandler({ actorId: 'a1', item: 'Longbow', pointBlankShot: true });
    expect(bow.use).toHaveBeenCalledWith({ skipDialog: true, chatMessage: false, options: { pointBlankShot: true, measureTemplate: false } });
    expect(result.attacks).toEqual([
      {
        label: 'Attack',
        attack: { total: 23, formula: '1d20 + 7', dice: [{ type: 'd20', count: 1, results: [16] }], natural: 16, isStatic: false, isThreat: false, isNat1: false },
        damage: [{ total: 7, formula: '1d8 + 2', dice: [{ type: 'd8', count: 1, results: [5] }], types: ['piercing'] }],
        damageTotal: 7,
        critDamage: [],
        nonlethal: false
      }
    ]);
  });

  it('pf1/apply-damage heals and answers the health', async () => {
    const result = await pf1ApplyDamageHandler({ actorId: 'a1', heal: 50 });
    expect(actor.applyDamage).toHaveBeenCalledWith(-50, { asNonlethal: false, asWounds: false });
    expect(result).toEqual({
      actorId: 'a1',
      applied: true,
      before: { hp: { value: 20, max: 28, temp: 0, nonlethal: 0 } },
      after: { hp: { value: 28, max: 28, temp: 0, nonlethal: 0 } }
    });
  });

  it('pf1/set-condition and pf1/get-actor-summary read the system registry', async () => {
    expect(await pf1SetConditionHandler({ actorId: 'a1', condition: 'frightened', active: true })).toEqual({
      actorId: 'a1',
      condition: 'frightened',
      active: true,
      changed: true,
      conditions: ['frightened']
    });
    const summary = await pf1GetActorSummaryHandler({ actorId: 'a1' });
    expect(summary).toMatchObject({ actorId: 'a1', conditions: ['frightened'], usableItems: [{ id: 'bow', actions: [{ id: 'act1', name: 'Attack' }] }] });
  });
});
