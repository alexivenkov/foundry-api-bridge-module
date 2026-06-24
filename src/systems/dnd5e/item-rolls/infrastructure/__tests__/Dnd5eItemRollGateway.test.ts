import { Dnd5eItemRollGateway } from '../Dnd5eItemRollGateway';
import type { FoundryItemRollGame } from '../foundryItemRollTypes';

const mockRoll = {
  total: 18,
  formula: '1d20 + 5',
  terms: [{ faces: 20, number: 1, results: [{ result: 13 }] }],
  isCritical: false,
  isFumble: false
};

function gatewayWith(rollAttack: jest.Mock): Dnd5eItemRollGateway {
  const activity = { _id: 'a1', type: 'attack', rollAttack, rollDamage: jest.fn() };
  const item = {
    id: 'item-1',
    name: 'Sword',
    type: 'weapon',
    system: { activities: { find: jest.fn().mockReturnValue(activity) } }
  };
  const actor = { id: 'actor-1', name: 'Hero', items: { get: jest.fn().mockReturnValue(item) } };
  const game = { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryItemRollGame;
  return new Dnd5eItemRollGateway(game);
}

function gatewayWithDamage(rollDamage: jest.Mock): Dnd5eItemRollGateway {
  const activity = { _id: 'a1', type: 'attack', rollAttack: jest.fn(), rollDamage };
  const item = {
    id: 'item-1',
    name: 'Sword',
    type: 'weapon',
    system: { activities: { find: jest.fn().mockReturnValue(activity) } }
  };
  const actor = { id: 'actor-1', name: 'Hero', items: { get: jest.fn().mockReturnValue(item) } };
  const game = { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryItemRollGame;
  return new Dnd5eItemRollGateway(game);
}

const mockDamageRoll = {
  total: 7,
  formula: '1d6 + 3',
  terms: [{ faces: 6, number: 1, results: [{ result: 4 }] }]
};

const noAdv = { advantage: false, disadvantage: false, showInChat: false };

describe('Dnd5eItemRollGateway', () => {
  it('rolls an attack and maps the Foundry roll to a RollOutcome', async () => {
    const rollAttack = jest.fn().mockResolvedValue([mockRoll]);
    const outcome = await gatewayWith(rollAttack).rollAttack('actor-1', 'item-1', noAdv);

    expect(rollAttack).toHaveBeenCalledWith({}, { configure: false }, { create: false });
    expect(outcome).toEqual({
      total: 18,
      formula: '1d20 + 5',
      dice: [{ type: 'd20', count: 1, results: [13] }]
    });
  });

  it('passes advantage and showInChat through', async () => {
    const rollAttack = jest.fn().mockResolvedValue([mockRoll]);
    await gatewayWith(rollAttack).rollAttack('actor-1', 'item-1', {
      advantage: true,
      disadvantage: false,
      showInChat: true
    });

    expect(rollAttack).toHaveBeenCalledWith({ advantage: true }, { configure: false }, { create: true });
  });

  it('passes disadvantage through', async () => {
    const rollAttack = jest.fn().mockResolvedValue([mockRoll]);
    await gatewayWith(rollAttack).rollAttack('actor-1', 'item-1', {
      advantage: false,
      disadvantage: true,
      showInChat: false
    });

    expect(rollAttack).toHaveBeenCalledWith({ disadvantage: true }, { configure: false }, { create: false });
  });

  it('maps the critical flag when present', async () => {
    const rollAttack = jest.fn().mockResolvedValue([{ ...mockRoll, isCritical: true }]);
    const outcome = await gatewayWith(rollAttack).rollAttack('actor-1', 'item-1', noAdv);

    expect(outcome.isCritical).toBe(true);
  });

  it('throws RollResolutionError when rollAttack returns null', async () => {
    const rollAttack = jest.fn().mockResolvedValue(null);
    await expect(
      gatewayWith(rollAttack).rollAttack('actor-1', 'item-1', noAdv)
    ).rejects.toThrow('Attack roll returned no results');
  });

  it('throws RollResolutionError when rollAttack returns an empty array', async () => {
    const rollAttack = jest.fn().mockResolvedValue([]);
    await expect(
      gatewayWith(rollAttack).rollAttack('actor-1', 'item-1', noAdv)
    ).rejects.toThrow('Attack roll returned no results');
  });

  it('rolls damage and maps the Foundry damage roll (no crit/fumble)', async () => {
    const rollDamage = jest.fn().mockResolvedValue([mockDamageRoll]);
    const outcome = await gatewayWithDamage(rollDamage).rollDamage('actor-1', 'item-1', {
      critical: false,
      showInChat: false
    });

    expect(rollDamage).toHaveBeenCalledWith({}, { configure: false }, { create: false });
    expect(outcome).toEqual({
      total: 7,
      formula: '1d6 + 3',
      dice: [{ type: 'd6', count: 1, results: [4] }]
    });
    expect(outcome.isCritical).toBeUndefined();
  });

  it('passes isCritical to rollDamage when critical', async () => {
    const rollDamage = jest.fn().mockResolvedValue([mockDamageRoll]);
    await gatewayWithDamage(rollDamage).rollDamage('actor-1', 'item-1', {
      critical: true,
      showInChat: true
    });

    expect(rollDamage).toHaveBeenCalledWith({ isCritical: true }, { configure: false }, { create: true });
  });

  it('throws RollResolutionError when rollDamage returns null', async () => {
    const rollDamage = jest.fn().mockResolvedValue(null);
    await expect(
      gatewayWithDamage(rollDamage).rollDamage('actor-1', 'item-1', { critical: false, showInChat: false })
    ).rejects.toThrow('Damage roll returned no results');
  });
});
