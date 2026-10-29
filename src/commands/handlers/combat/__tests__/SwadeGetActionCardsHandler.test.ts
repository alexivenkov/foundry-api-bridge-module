import { makeCombat } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const mockGame = {
  system: { id: 'swade' },
  combat: null as unknown,
  combats: { get: jest.fn(), active: null as unknown }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { swadeGetActionCardsHandler } from '../SwadeGetActionCardsHandler';

describe('swade/get-action-cards handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'swade';
    mockGame.combat = makeCombat();
    mockGame.combats.get.mockReturnValue(undefined);
  });

  it('returns the dealt cards of the active combat', async () => {
    const result = await swadeGetActionCardsHandler({});
    expect(result).toMatchObject({ combatId: 'combat-1', round: 2, turn: 0 });
    expect(result.combatants[0]).toMatchObject({ combatantId: 'c1', cardValue: 12, suitValue: 4, cardString: 'Queen of Spades', hasJoker: false, initiative: 12.4 });
  });

  it('fails without an active combat', async () => {
    mockGame.combat = null;
    await expect(swadeGetActionCardsHandler({})).rejects.toThrow('No active combat');
  });

  it('rejects in a dnd5e world', async () => {
    mockGame.system.id = 'dnd5e';
    await expect(swadeGetActionCardsHandler({})).rejects.toThrow("Operation 'swade/get-action-cards' is not supported by game system 'dnd5e'");
  });
});
