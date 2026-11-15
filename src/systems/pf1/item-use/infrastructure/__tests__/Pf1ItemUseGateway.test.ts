import { Pf1ItemUseGateway } from '../Pf1ItemUseGateway';
import type { UseItemOptions } from '@/systems/pf1/item-use/domain';
import {
  byActor,
  chatAttack,
  d20RollData,
  damageRollData,
  liveRoll,
  makeActor,
  makeGame,
  makeItem
} from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

const defaults: UseItemOptions = { actionId: undefined, cost: undefined, rollMode: undefined, showInChat: false, toggles: {} };

describe('Pf1ItemUseGateway', () => {
  it('uses the item without dialogs or template placement and reads every attack back', async () => {
    const sword = makeItem();
    sword.use.mockResolvedValue({
      shared: {
        action: { id: 'act1', name: 'Attack' },
        chatAttacks: [
          chatAttack({
            label: 'Attack',
            attack: liveRoll(d20RollData([19], 8, { critical: 19 })),
            critConfirm: liveRoll(d20RollData([11], 8)),
            damage: { total: 9, rolls: [liveRoll(damageRollData(8, [5], 4, ['slashing']))] },
            critDamage: { total: 17, rolls: [liveRoll(damageRollData(8, [4], 4, ['slashing']))] }
          }),
          chatAttack({
            label: 'Iterative Attack',
            attack: liveRoll(d20RollData([1], 3)),
            damage: { total: 6, rolls: [liveRoll(damageRollData(8, [2], 4, ['slashing']))] }
          })
        ]
      }
    });
    const actor = makeActor({ items: [sword] });

    const outcome = await new Pf1ItemUseGateway(makeGame({ actors: [actor] })).useItem(byActor, 'i1', {
      ...defaults,
      toggles: { powerAttack: true }
    });

    expect(sword.use).toHaveBeenCalledWith({
      skipDialog: true,
      chatMessage: false,
      options: { powerAttack: true, measureTemplate: false }
    });
    expect(outcome.item).toEqual({ id: 'i1', name: 'Longsword', type: 'weapon' });
    expect(outcome.action).toEqual({ id: 'act1', name: 'Attack' });
    expect(outcome.attacks).toHaveLength(2);
    expect(outcome.attacks[0]).toEqual({
      label: 'Attack',
      attack: {
        total: 27,
        formula: '1d20 + 8',
        dice: [{ type: 'd20', count: 1, results: [19] }],
        natural: 19,
        isStatic: false,
        isThreat: true,
        isNat1: false
      },
      critConfirm: {
        total: 19,
        formula: '1d20 + 8',
        dice: [{ type: 'd20', count: 1, results: [11] }],
        natural: 11,
        isStatic: false
      },
      damage: [{ total: 9, formula: '1d8 + 4', dice: [{ type: 'd8', count: 1, results: [5] }], types: ['slashing'] }],
      damageTotal: 9,
      critDamage: [{ total: 8, formula: '1d8 + 4', dice: [{ type: 'd8', count: 1, results: [4] }], types: ['slashing'] }],
      critDamageTotal: 17,
      nonlethal: false
    });
    expect(outcome.attacks[1]).toMatchObject({ attack: { natural: 1, isThreat: false, isNat1: true }, damageTotal: 6, critDamage: [] });
    expect(outcome.attacks[1]).not.toHaveProperty('critDamageTotal');
  });

  it('passes the action, cost, roll mode and chat flag through and reports the save DC and message', async () => {
    const fireball = makeItem({ id: 'sp1', name: 'Fireball', type: 'spell', system: { actions: [{ _id: 'cast', name: 'Cast' }] } });
    fireball.use.mockResolvedValue({ shared: { action: { id: 'cast', name: 'Cast' }, saveDC: 16, save: 'ref', message: { id: 'card-3' } } });
    const actor = makeActor({ items: [fireball] });

    const outcome = await new Pf1ItemUseGateway(makeGame({ actors: [actor] })).useItem(byActor, 'fireball', {
      actionId: 'cast',
      cost: 0,
      rollMode: 'blindroll',
      showInChat: true,
      toggles: { clCheck: true }
    });

    expect(fireball.use).toHaveBeenCalledWith({
      actionId: 'cast',
      cost: 0,
      rollMode: 'blindroll',
      skipDialog: true,
      chatMessage: true,
      options: { clCheck: true, measureTemplate: false }
    });
    expect(outcome).toEqual({
      actorId: 'a1',
      item: { id: 'sp1', name: 'Fireball', type: 'spell' },
      action: { id: 'cast', name: 'Cast' },
      attacks: [],
      save: { dc: 16, type: 'ref' },
      messageId: 'card-3'
    });
  });

  it('leaves out the zero save DC of an action without a save and the empty notes-only attack of a spell', async () => {
    const holdPerson = makeItem({ id: 'hp', name: 'Hold Person', type: 'spell' });
    holdPerson.use.mockResolvedValue({ shared: { saveDC: 17, save: 'will', chatAttacks: [chatAttack({ label: '' })] } });
    const sword = makeItem({ id: 'sw', name: 'Sword' });
    sword.use.mockResolvedValue({ shared: { saveDC: 0, chatAttacks: [chatAttack({ attack: liveRoll(d20RollData([8], 2)) })] } });
    const gateway = new Pf1ItemUseGateway(makeGame({ actors: [makeActor({ items: [holdPerson, sword] })] }));

    const spell = await gateway.useItem(byActor, 'hp', defaults);
    expect(spell.attacks).toEqual([]);
    expect(spell.save).toEqual({ dc: 17, type: 'will' });

    const attack = await gateway.useItem(byActor, 'sw', defaults);
    expect(attack.attacks).toHaveLength(1);
    expect(attack).not.toHaveProperty('save');

    // A potion of Cure Light Wounds carries "Will half (harmless)" but pf1 never computes its DC.
    sword.use.mockResolvedValueOnce({ shared: { saveDC: 0, save: 'will', chatAttacks: [] } });
    expect(await gateway.useItem(byActor, 'sw', defaults)).not.toHaveProperty('save');
  });

  it('reads an item without actions (the system answers its shared data directly)', async () => {
    const torch = makeItem({ id: 'l1', name: 'Torch', type: 'loot', system: {} });
    torch.use.mockResolvedValue({ message: { id: 'desc-card' } });
    const outcome = await new Pf1ItemUseGateway(makeGame({ actors: [makeActor({ items: [torch] })] })).useItem(byActor, 'l1', defaults);
    expect(outcome).toEqual({ actorId: 'a1', item: { id: 'l1', name: 'Torch', type: 'loot' }, attacks: [], messageId: 'desc-card' });
  });

  it('turns requirement failures and cancellations into errors', async () => {
    const wand = makeItem({ id: 'w1', name: 'Wand' });
    const gateway = new Pf1ItemUseGateway(makeGame({ actors: [makeActor({ items: [wand] })] }));

    wand.use.mockResolvedValueOnce({ err: {}, code: 4 });
    await expect(gateway.useItem(byActor, 'w1', defaults)).rejects.toThrow('Item cannot be used: not enough charges or spell slots');
    wand.use.mockResolvedValueOnce({ err: {}, code: 99 });
    await expect(gateway.useItem(byActor, 'w1', defaults)).rejects.toThrow('requirement 99 not met');
    wand.use.mockResolvedValueOnce(undefined);
    await expect(gateway.useItem(byActor, 'w1', defaults)).rejects.toThrow('Item use was refused or cancelled');
    wand.use.mockResolvedValueOnce({ shared: { reject: true } });
    await expect(gateway.useItem(byActor, 'w1', defaults)).rejects.toThrow('Item use was refused or cancelled');
    wand.use.mockResolvedValueOnce({ reject: true });
    await expect(gateway.useItem(byActor, 'w1', defaults)).rejects.toThrow('Item use was refused or cancelled');
  });

  it('validates the item and action before using anything', async () => {
    const a = makeItem({ id: 'd1', name: 'Dagger' });
    const b = makeItem({ id: 'd2', name: 'dagger' });
    const gateway = new Pf1ItemUseGateway(makeGame({ actors: [makeActor({ items: [a, b] })] }));

    await expect(gateway.useItem(byActor, 'Dagger', defaults)).rejects.toThrow('Several items are named Dagger: d1, d2. Pass the item id');
    await expect(gateway.useItem(byActor, 'Halberd', defaults)).rejects.toThrow('Halberd');
    await expect(gateway.useItem(byActor, 'd1', { ...defaults, actionId: 'zz' })).rejects.toThrow(
      'Action not found on Dagger: zz. Actions: act1 (Attack)'
    );
    expect(a.use).not.toHaveBeenCalled();
  });
});
