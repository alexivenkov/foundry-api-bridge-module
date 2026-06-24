import { Dnd5eActorRollGateway } from '../Dnd5eActorRollGateway';
import type { FoundryRollGame } from '../foundryRollTypes';
import { ActorNotFoundError, RollResolutionError } from '@/systems/shared/domain/errors';

const mockRoll = {
  total: 15,
  formula: '1d20 + 5',
  terms: [{ faces: 20, number: 1, results: [{ result: 10 }] }],
  isCritical: false,
  isFumble: false
};

function createGame(actor: unknown): FoundryRollGame {
  return {
    actors: { get: jest.fn().mockReturnValue(actor) }
  } as unknown as FoundryRollGame;
}

describe('Dnd5eActorRollGateway', () => {
  it('rolls a skill and maps the Foundry roll to a RollOutcome', async () => {
    const rollSkill = jest.fn().mockResolvedValue([mockRoll]);
    const gateway = new Dnd5eActorRollGateway(createGame({ id: 'a1', name: 'Hero', rollSkill }));

    const outcome = await gateway.rollSkill('a1', 'ste', { showInChat: false });

    expect(rollSkill).toHaveBeenCalledWith(
      { skill: 'ste' },
      { configure: false },
      { create: false }
    );
    expect(outcome).toEqual({
      total: 15,
      formula: '1d20 + 5',
      dice: [{ type: 'd20', count: 1, results: [10] }]
    });
  });

  it('passes showInChat through to the message config', async () => {
    const rollSkill = jest.fn().mockResolvedValue([mockRoll]);
    const gateway = new Dnd5eActorRollGateway(createGame({ id: 'a1', name: 'Hero', rollSkill }));

    await gateway.rollSkill('a1', 'prc', { showInChat: true });

    expect(rollSkill).toHaveBeenCalledWith(
      { skill: 'prc' },
      { configure: false },
      { create: true }
    );
  });

  it('maps critical and fumble flags only when set', async () => {
    const critRoll = {
      ...mockRoll,
      total: 25,
      isCritical: true,
      terms: [{ faces: 20, number: 1, results: [{ result: 20 }] }]
    };
    const rollSkill = jest.fn().mockResolvedValue([critRoll]);
    const gateway = new Dnd5eActorRollGateway(createGame({ id: 'a1', name: 'Hero', rollSkill }));

    const outcome = await gateway.rollSkill('a1', 'ath', { showInChat: false });

    expect(outcome.isCritical).toBe(true);
    expect(outcome.isFumble).toBeUndefined();
  });

  it('throws ActorNotFoundError when the actor is missing', async () => {
    const gateway = new Dnd5eActorRollGateway(createGame(undefined));

    await expect(
      gateway.rollSkill('missing', 'ste', { showInChat: false })
    ).rejects.toThrow(ActorNotFoundError);
    await expect(
      gateway.rollSkill('missing', 'ste', { showInChat: false })
    ).rejects.toThrow('Actor not found: missing');
  });

  it('throws RollResolutionError when no roll is returned', async () => {
    const rollSkill = jest.fn().mockResolvedValue([]);
    const gateway = new Dnd5eActorRollGateway(createGame({ id: 'a1', name: 'Hero', rollSkill }));

    await expect(
      gateway.rollSkill('a1', 'ste', { showInChat: false })
    ).rejects.toThrow(RollResolutionError);
    await expect(
      gateway.rollSkill('a1', 'ste', { showInChat: false })
    ).rejects.toThrow('Skill roll returned no results');
  });
});
