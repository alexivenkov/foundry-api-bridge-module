import { Pf2eActorRollGateway } from '../Pf2eActorRollGateway';
import type { FoundryCheckRoll, FoundryPf2eRollGame, FoundryStatistic } from '../foundryPf2eRollTypes';
import {
  ActorNotFoundError,
  RollResolutionError,
  ValidationError
} from '@/systems/shared/domain/errors';

function checkRoll(overrides: Partial<FoundryCheckRoll> = {}): FoundryCheckRoll {
  return {
    total: 18,
    formula: '1d20 + 8',
    dice: [{ faces: 20, number: 1, results: [{ result: 10 }] }],
    degreeOfSuccess: 2,
    ...overrides
  };
}

function statistic(roll: FoundryCheckRoll): { statistic: FoundryStatistic; rollFn: jest.Mock } {
  const rollFn = jest.fn().mockResolvedValue(roll);
  return { statistic: { check: { roll: rollFn } }, rollFn };
}

function createGame(actor: unknown): FoundryPf2eRollGame {
  return { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryPf2eRollGame;
}

describe('Pf2eActorRollGateway', () => {
  it('rolls a skill via the Statistic check API and maps the result', async () => {
    const { statistic: acrobatics, rollFn } = statistic(checkRoll());
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: { acrobatics }, saves: {}, perception: acrobatics })
    );

    const outcome = await gateway.rollSkill('a1', 'acrobatics', { showInChat: true });

    expect(rollFn).toHaveBeenCalledWith({ skipDialog: true, createMessage: true });
    expect(outcome).toEqual({
      total: 18,
      formula: '1d20 + 8',
      dice: [{ type: 'd20', count: 1, results: [10] }]
    });
  });

  it('maps critical success to isCritical', async () => {
    const { statistic: acrobatics } = statistic(checkRoll({ degreeOfSuccess: 3 }));
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: { acrobatics }, saves: {}, perception: acrobatics })
    );

    const outcome = await gateway.rollSkill('a1', 'acrobatics', { showInChat: false });

    expect(outcome.isCritical).toBe(true);
    expect(outcome.isFumble).toBeUndefined();
  });

  it('maps critical failure to isFumble', async () => {
    const { statistic: acrobatics } = statistic(checkRoll({ degreeOfSuccess: 0 }));
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: { acrobatics }, saves: {}, perception: acrobatics })
    );

    const outcome = await gateway.rollSkill('a1', 'acrobatics', { showInChat: false });

    expect(outcome.isFumble).toBe(true);
    expect(outcome.isCritical).toBeUndefined();
  });

  it('rolls a saving throw via actor.saves', async () => {
    const { statistic: fortitude, rollFn } = statistic(checkRoll());
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: {}, saves: { fortitude }, perception: fortitude })
    );

    await gateway.rollSave('a1', 'fortitude', { showInChat: false });

    expect(rollFn).toHaveBeenCalledWith({ skipDialog: true, createMessage: false });
  });

  it('rolls perception via actor.perception', async () => {
    const { statistic: perception, rollFn } = statistic(checkRoll());
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: {}, saves: {}, perception })
    );

    await gateway.rollPerception('a1', { showInChat: true });

    expect(rollFn).toHaveBeenCalledWith({ skipDialog: true, createMessage: true });
  });

  it('throws ActorNotFoundError when the actor is missing', async () => {
    const gateway = new Pf2eActorRollGateway(createGame(undefined));

    await expect(gateway.rollSkill('missing', 'acrobatics', { showInChat: false })).rejects.toThrow(
      ActorNotFoundError
    );
  });

  it('throws ValidationError for an unknown skill slug', async () => {
    const { statistic: stat } = statistic(checkRoll());
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: {}, saves: {}, perception: stat })
    );

    await expect(gateway.rollSkill('a1', 'acr', { showInChat: false })).rejects.toThrow(ValidationError);
  });

  it('throws RollResolutionError when the skill is absent on the actor', async () => {
    const { statistic: stat } = statistic(checkRoll());
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: {}, saves: {}, perception: stat })
    );

    await expect(gateway.rollSkill('a1', 'thievery', { showInChat: false })).rejects.toThrow(
      'Skill not available on actor: thievery'
    );
  });

  it('throws RollResolutionError when the check returns null', async () => {
    const rollFn = jest.fn().mockResolvedValue(null);
    const acrobatics: FoundryStatistic = { check: { roll: rollFn } };
    const gateway = new Pf2eActorRollGateway(
      createGame({ id: 'a1', name: 'Hero', skills: { acrobatics }, saves: {}, perception: acrobatics })
    );

    await expect(gateway.rollSkill('a1', 'acrobatics', { showInChat: false })).rejects.toThrow(
      RollResolutionError
    );
  });
});
