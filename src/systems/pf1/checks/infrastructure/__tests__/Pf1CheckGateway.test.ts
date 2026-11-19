import { Pf1CheckGateway } from '../Pf1CheckGateway';
import type { Pf1CheckOptions } from '@/systems/pf1/shared/domain';
import {
  byActor,
  createdMessage,
  d20RollData,
  makeActor,
  makeGame,
  messageData
} from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

const quiet: Pf1CheckOptions = { bonus: undefined, dc: undefined, takeX: undefined, rollMode: undefined, showInChat: false };

describe('Pf1CheckGateway', () => {
  it('rolls an ability check without dialog or chat card and answers the check', async () => {
    const actor = makeActor();
    const outcome = await new Pf1CheckGateway(makeGame({ actors: [actor] })).rollAbility(byActor, 'str', quiet);

    expect(actor.rollAbilityTest).toHaveBeenCalledWith('str', { skipDialog: true, chatMessage: false });
    expect(outcome).toEqual({
      actorId: 'a1',
      kind: 'ability',
      id: 'str',
      name: 'Strength',
      total: 17,
      formula: '1d20 + 5',
      dice: [{ type: 'd20', count: 1, results: [12] }],
      natural: 12,
      isStatic: false,
      isNat20: false,
      isNat1: false
    });
  });

  it('forwards bonus, DC, Take 10 and roll mode to the system and judges against the DC', async () => {
    const actor = makeActor({ roll: messageData(d20RollData([10], 4, { staticRoll: 10, dc: 15 })) });
    const outcome = await new Pf1CheckGateway(makeGame({ actors: [actor] })).rollSkill(byActor, 'Perception', {
      bonus: '2[Guidance]',
      dc: 15,
      takeX: 10,
      rollMode: 'gmroll',
      showInChat: false
    });

    expect(actor.rollSkill).toHaveBeenCalledWith('per', {
      skipDialog: true,
      chatMessage: false,
      bonus: '2[Guidance]',
      dc: 15,
      staticRoll: 10,
      rollMode: 'gmroll'
    });
    expect(outcome).toMatchObject({ kind: 'skill', id: 'per', name: 'Perception', dc: 15, isSuccess: false, isStatic: true, isNat20: false });
  });

  it('answers the message id when it posted the card', async () => {
    const actor = makeActor({ roll: createdMessage(d20RollData([15], 2), 'card-7') });
    const outcome = await new Pf1CheckGateway(makeGame({ actors: [actor] })).rollSave(byActor, 'will', { ...quiet, showInChat: true });
    expect(actor.rollSavingThrow).toHaveBeenCalledWith('will', { skipDialog: true, chatMessage: true });
    expect(outcome).toMatchObject({ kind: 'save', name: 'Will', total: 17, messageId: 'card-7' });
  });

  it('applies the natural 1 / natural 20 rule to saving throws only', async () => {
    const nat20 = makeActor({ roll: messageData(d20RollData([20], -5)) });
    const save = await new Pf1CheckGateway(makeGame({ actors: [nat20] })).rollSave(byActor, 'fort', { ...quiet, dc: 30 });
    expect(save).toMatchObject({ total: 15, isNat20: true, isSuccess: true });

    const nat1 = makeActor({ roll: messageData(d20RollData([1], 30)) });
    const failed = await new Pf1CheckGateway(makeGame({ actors: [nat1] })).rollSave(byActor, 'ref', { ...quiet, dc: 10 });
    expect(failed).toMatchObject({ total: 31, isNat1: true, isSuccess: false });

    const skill = await new Pf1CheckGateway(makeGame({ actors: [nat1] })).rollSkill(byActor, 'acr', { ...quiet, dc: 10 });
    expect(skill).toMatchObject({ isNat1: true, isSuccess: true });
  });

  it('rolls caster level and concentration checks for a spellbook in use', async () => {
    const actor = makeActor();
    const gateway = new Pf1CheckGateway(makeGame({ actors: [actor] }));
    expect(await gateway.rollCasterLevel(byActor, 'primary', quiet)).toMatchObject({ kind: 'caster-level', id: 'primary', name: 'Cleric' });
    expect(await gateway.rollConcentration(byActor, 'primary', quiet)).toMatchObject({ kind: 'concentration' });
    expect(actor.rollCL).toHaveBeenCalledWith('primary', { skipDialog: true, chatMessage: false });
    expect(actor.rollConcentration).toHaveBeenCalledWith('primary', { skipDialog: true, chatMessage: false });
  });

  it('names a spellbook by its derived label when the user left its name blank', async () => {
    const actor = makeActor();
    const book = actor.system.attributes!.spells!.spellbooks!['primary']!;
    book.name = '';
    book.label = 'Oracle';
    const outcome = await new Pf1CheckGateway(makeGame({ actors: [actor] })).rollCasterLevel(byActor, 'primary', quiet);
    expect(outcome.name).toBe('Oracle');
  });

  it('refuses a spellbook that is not in use and lists the ones that are', async () => {
    const gateway = new Pf1CheckGateway(makeGame({ actors: [makeActor()] }));
    await expect(gateway.rollCasterLevel(byActor, 'secondary', quiet)).rejects.toThrow(
      'Spellbook not in use: secondary. Spellbooks in use on Valeros: primary'
    );
    await expect(gateway.rollConcentration(byActor, 'nope', quiet)).rejects.toThrow('Spellbook not in use: nope');
  });

  it('refuses actors without abilities or saves', async () => {
    const haunt = makeActor({ name: 'Haunt', type: 'haunt', system: {} });
    const gateway = new Pf1CheckGateway(makeGame({ actors: [haunt] }));
    await expect(gateway.rollAbility(byActor, 'wis', quiet)).rejects.toThrow('Actor has no ability scores: Haunt');
    await expect(gateway.rollSave(byActor, 'will', quiet)).rejects.toThrow('Actor has no saving throws: Haunt');
    await expect(gateway.rollCasterLevel(byActor, 'primary', quiet)).rejects.toThrow('Spellbooks in use on Haunt: none');
  });

  it('reports a roll a hook cancelled', async () => {
    const actor = makeActor({ roll: undefined });
    await expect(new Pf1CheckGateway(makeGame({ actors: [actor] })).rollAbility(byActor, 'dex', quiet)).rejects.toThrow('Roll was cancelled');
  });
});
