import { createCombatHandler } from '../CreateCombatHandler';
import { addCombatantHandler } from '../AddCombatantHandler';
import { removeCombatantHandler } from '../RemoveCombatantHandler';
import { startCombatHandler } from '../StartCombatHandler';
import { endCombatHandler } from '../EndCombatHandler';
import { nextTurnHandler } from '../NextTurnHandler';
import { previousTurnHandler } from '../PreviousTurnHandler';
import { getCombatStateHandler } from '../GetCombatStateHandler';
import { rollInitiativeHandler } from '../RollInitiativeHandler';
import { setInitiativeHandler } from '../SetInitiativeHandler';
import { rollAllInitiativeHandler } from '../RollAllInitiativeHandler';
import { updateCombatantHandler } from '../UpdateCombatantHandler';
import { setCombatantDefeatedHandler } from '../SetCombatantDefeatedHandler';
import { toggleCombatantVisibilityHandler } from '../ToggleCombatantVisibilityHandler';

interface MockCombatant {
  id: string;
  actorId: string;
  tokenId: string | null;
  name: string;
  img: string;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
  update: jest.Mock;
}

interface MockCombat {
  id: string;
  round: number;
  turn: number;
  started: boolean;
  combatant: MockCombatant | null;
  combatants: {
    get: jest.Mock;
    map: jest.Mock;
    contents: MockCombatant[];
  };
  turns: MockCombatant[];
  activate: jest.Mock;
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
  startCombat: jest.Mock;
  endCombat: jest.Mock;
  nextTurn: jest.Mock;
  previousTurn: jest.Mock;
  rollInitiative: jest.Mock;
  rollAll: jest.Mock;
  rollNPC: jest.Mock;
  setInitiative: jest.Mock;
}

const createMockCombatant = (overrides: Partial<MockCombatant> = {}): MockCombatant => {
  const combatant: MockCombatant = {
    id: 'combatant-123',
    actorId: 'actor-456',
    tokenId: 'token-789',
    name: 'Test Fighter',
    img: 'icons/fighter.png',
    initiative: 15,
    defeated: false,
    hidden: false,
    update: jest.fn(),
    ...overrides
  };
  combatant.update.mockImplementation((data) => Promise.resolve({ ...combatant, ...data }));
  return combatant;
};

const createMockCombat = (overrides: Partial<MockCombat> = {}): MockCombat => {
  const mockCombatant = createMockCombatant();
  const baseCombat: MockCombat = {
    id: 'combat-123',
    round: 0,
    turn: 0,
    started: false,
    combatant: null,
    combatants: {
      get: jest.fn().mockReturnValue(mockCombatant),
      map: jest.fn().mockImplementation((fn) => [fn(mockCombatant)]),
      contents: [mockCombatant]
    },
    turns: [mockCombatant],
    activate: jest.fn().mockResolvedValue(undefined),
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
    startCombat: jest.fn(),
    endCombat: jest.fn().mockResolvedValue(undefined),
    nextTurn: jest.fn(),
    previousTurn: jest.fn(),
    rollInitiative: jest.fn(),
    rollAll: jest.fn(),
    rollNPC: jest.fn(),
    setInitiative: jest.fn().mockResolvedValue(undefined)
  };

  // Self-referential mocks need to be set after object creation
  baseCombat.startCombat.mockImplementation(() => Promise.resolve({ ...baseCombat, started: true, round: 1 }));
  baseCombat.nextTurn.mockImplementation(() => Promise.resolve({ ...baseCombat, turn: baseCombat.turn + 1 }));
  baseCombat.previousTurn.mockImplementation(() => Promise.resolve({ ...baseCombat, turn: Math.max(0, baseCombat.turn - 1) }));
  baseCombat.rollInitiative.mockImplementation(() => Promise.resolve(baseCombat));
  baseCombat.rollAll.mockImplementation(() => Promise.resolve(baseCombat));
  baseCombat.rollNPC.mockImplementation(() => Promise.resolve(baseCombat));

  return { ...baseCombat, ...overrides };
};

const mockCombatConstructor = {
  create: jest.fn()
};

const mockGame: {
  combat: MockCombat | null;
  combats: {
    get: jest.Mock;
    active: MockCombat | null;
  };
  scenes: {
    active: { id: string } | null;
  };
} = {
  combat: null,
  combats: {
    get: jest.fn(),
    active: null
  },
  scenes: {
    active: { id: 'scene-123' }
  }
};

(global as Record<string, unknown>)['game'] = mockGame;
(global as Record<string, unknown>)['Combat'] = mockCombatConstructor;

describe('Combat Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.combat = null;
    mockGame.combats.active = null;
    mockGame.scenes.active = { id: 'scene-123' };
  });

  describe('createCombatHandler', () => {
    it('creates combat with default scene', async () => {
      const mockCombat = createMockCombat();
      mockCombatConstructor.create.mockResolvedValue(mockCombat);

      const result = await createCombatHandler({});

      expect(mockCombatConstructor.create).toHaveBeenCalledWith({
        scene: 'scene-123'
      });
      expect(result).toEqual({
        id: 'combat-123',
        round: 0,
        turn: 0,
        started: false,
        combatants: expect.any(Array),
        current: null
      });
    });

    it('creates combat with specified scene', async () => {
      const mockCombat = createMockCombat();
      mockCombatConstructor.create.mockResolvedValue(mockCombat);

      await createCombatHandler({ sceneId: 'custom-scene' });

      expect(mockCombatConstructor.create).toHaveBeenCalledWith({
        scene: 'custom-scene'
      });
    });

    it('activates combat when activate param is true', async () => {
      const mockCombat = createMockCombat();
      mockCombatConstructor.create.mockResolvedValue(mockCombat);

      await createCombatHandler({ activate: true });

      expect(mockCombat.activate).toHaveBeenCalled();
    });

    it('does not activate combat when activate param is false', async () => {
      const mockCombat = createMockCombat();
      mockCombatConstructor.create.mockResolvedValue(mockCombat);

      await createCombatHandler({ activate: false });

      expect(mockCombat.activate).not.toHaveBeenCalled();
    });

    it('returns combatants in result', async () => {
      const mockCombatant = createMockCombatant({ name: 'Warrior' });
      const mockCombat = createMockCombat({
        turns: [mockCombatant]
      });
      mockCombatConstructor.create.mockResolvedValue(mockCombat);

      const result = await createCombatHandler({});

      expect(result.combatants).toHaveLength(1);
      expect(result.combatants[0]).toEqual({
        id: 'combatant-123',
        actorId: 'actor-456',
        tokenId: 'token-789',
        name: 'Warrior',
        img: 'icons/fighter.png',
        initiative: 15,
        defeated: false,
        hidden: false
      });
    });

    it('handles no active scene', async () => {
      mockGame.scenes.active = null;
      const mockCombat = createMockCombat();
      mockCombatConstructor.create.mockResolvedValue(mockCombat);

      await createCombatHandler({});

      expect(mockCombatConstructor.create).toHaveBeenCalledWith({});
    });
  });

  describe('addCombatantHandler', () => {
    it('throws error when no active combat and no combatId', async () => {
      mockGame.combat = null;

      await expect(
        addCombatantHandler({ actorId: 'actor-123' })
      ).rejects.toThrow('No active combat');
    });

    it('throws error when combat not found by id', async () => {
      mockGame.combats.get.mockReturnValue(undefined);

      await expect(
        addCombatantHandler({ combatId: 'nonexistent', actorId: 'actor-123' })
      ).rejects.toThrow('Combat not found: nonexistent');
    });

    it('adds combatant to active combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.createEmbeddedDocuments.mockResolvedValue([mockCombatant]);
      mockGame.combat = mockCombat;

      const result = await addCombatantHandler({ actorId: 'actor-456' });

      expect(mockCombat.createEmbeddedDocuments).toHaveBeenCalledWith(
        'Combatant',
        [{ actorId: 'actor-456' }]
      );
      expect(result).toEqual({
        id: 'combatant-123',
        actorId: 'actor-456',
        tokenId: 'token-789',
        name: 'Test Fighter',
        img: 'icons/fighter.png',
        initiative: 15,
        defeated: false,
        hidden: false
      });
    });

    it('adds combatant to specified combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.createEmbeddedDocuments.mockResolvedValue([mockCombatant]);
      mockGame.combats.get.mockReturnValue(mockCombat);

      await addCombatantHandler({
        combatId: 'combat-123',
        actorId: 'actor-456'
      });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.createEmbeddedDocuments).toHaveBeenCalled();
    });

    it('adds combatant with tokenId', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.createEmbeddedDocuments.mockResolvedValue([mockCombatant]);
      mockGame.combat = mockCombat;

      await addCombatantHandler({
        actorId: 'actor-456',
        tokenId: 'token-789'
      });

      expect(mockCombat.createEmbeddedDocuments).toHaveBeenCalledWith(
        'Combatant',
        [{ actorId: 'actor-456', tokenId: 'token-789' }]
      );
    });

    it('adds combatant with initiative', async () => {
      const mockCombatant = createMockCombatant({ initiative: 20 });
      const mockCombat = createMockCombat();
      mockCombat.createEmbeddedDocuments.mockResolvedValue([mockCombatant]);
      mockGame.combat = mockCombat;

      await addCombatantHandler({
        actorId: 'actor-456',
        initiative: 20
      });

      expect(mockCombat.createEmbeddedDocuments).toHaveBeenCalledWith(
        'Combatant',
        [{ actorId: 'actor-456', initiative: 20 }]
      );
    });

    it('adds hidden combatant', async () => {
      const mockCombatant = createMockCombatant({ hidden: true });
      const mockCombat = createMockCombat();
      mockCombat.createEmbeddedDocuments.mockResolvedValue([mockCombatant]);
      mockGame.combat = mockCombat;

      await addCombatantHandler({
        actorId: 'actor-456',
        hidden: true
      });

      expect(mockCombat.createEmbeddedDocuments).toHaveBeenCalledWith(
        'Combatant',
        [{ actorId: 'actor-456', hidden: true }]
      );
    });

    it('throws error when creation fails', async () => {
      const mockCombat = createMockCombat();
      mockCombat.createEmbeddedDocuments.mockResolvedValue([]);
      mockGame.combat = mockCombat;

      await expect(
        addCombatantHandler({ actorId: 'actor-456' })
      ).rejects.toThrow('Failed to create combatant');
    });
  });

  describe('removeCombatantHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(
        removeCombatantHandler({ combatantId: 'combatant-123' })
      ).rejects.toThrow('No active combat');
    });

    it('throws error when combatant not found', async () => {
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(undefined);
      mockGame.combat = mockCombat;

      await expect(
        removeCombatantHandler({ combatantId: 'nonexistent' })
      ).rejects.toThrow('Combatant not found: nonexistent');
    });

    it('removes combatant from active combat', async () => {
      const mockCombat = createMockCombat();
      mockGame.combat = mockCombat;

      const result = await removeCombatantHandler({ combatantId: 'combatant-123' });

      expect(mockCombat.deleteEmbeddedDocuments).toHaveBeenCalledWith(
        'Combatant',
        ['combatant-123']
      );
      expect(result).toEqual({ deleted: true });
    });

    it('removes combatant from specified combat', async () => {
      const mockCombat = createMockCombat();
      mockGame.combats.get.mockReturnValue(mockCombat);

      await removeCombatantHandler({
        combatId: 'combat-123',
        combatantId: 'combatant-123'
      });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.deleteEmbeddedDocuments).toHaveBeenCalled();
    });
  });

  describe('startCombatHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(startCombatHandler({})).rejects.toThrow('No active combat');
    });

    it('throws error when combat already started', async () => {
      const mockCombat = createMockCombat({ started: true });
      mockGame.combat = mockCombat;

      await expect(startCombatHandler({})).rejects.toThrow('Combat already started');
    });

    it('starts combat and returns updated state', async () => {
      const mockCombat = createMockCombat();
      mockGame.combat = mockCombat;

      const result = await startCombatHandler({});

      expect(mockCombat.startCombat).toHaveBeenCalled();
      expect(result.started).toBe(true);
      expect(result.round).toBe(1);
    });

    it('starts specified combat', async () => {
      const mockCombat = createMockCombat();
      mockGame.combats.get.mockReturnValue(mockCombat);

      await startCombatHandler({ combatId: 'combat-123' });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.startCombat).toHaveBeenCalled();
    });
  });

  describe('endCombatHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(endCombatHandler({})).rejects.toThrow('No active combat');
    });

    it('ends combat and returns deleted result', async () => {
      const mockCombat = createMockCombat();
      mockGame.combat = mockCombat;

      const result = await endCombatHandler({});

      expect(mockCombat.endCombat).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });

    it('ends specified combat', async () => {
      const mockCombat = createMockCombat();
      mockGame.combats.get.mockReturnValue(mockCombat);

      await endCombatHandler({ combatId: 'combat-123' });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.endCombat).toHaveBeenCalled();
    });
  });

  describe('nextTurnHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(nextTurnHandler({})).rejects.toThrow('No active combat');
    });

    it('throws error when combat not started', async () => {
      const mockCombat = createMockCombat({ started: false });
      mockGame.combat = mockCombat;

      await expect(nextTurnHandler({})).rejects.toThrow('Combat not started');
    });

    it('advances to next turn', async () => {
      const mockCombat = createMockCombat({ started: true, turn: 0 });
      mockGame.combat = mockCombat;

      const result = await nextTurnHandler({});

      expect(mockCombat.nextTurn).toHaveBeenCalled();
      expect(result.turn).toBe(1);
    });

    it('advances turn in specified combat', async () => {
      const mockCombat = createMockCombat({ started: true });
      mockGame.combats.get.mockReturnValue(mockCombat);

      await nextTurnHandler({ combatId: 'combat-123' });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.nextTurn).toHaveBeenCalled();
    });
  });

  describe('previousTurnHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(previousTurnHandler({})).rejects.toThrow('No active combat');
    });

    it('throws error when combat not started', async () => {
      const mockCombat = createMockCombat({ started: false });
      mockGame.combat = mockCombat;

      await expect(previousTurnHandler({})).rejects.toThrow('Combat not started');
    });

    it('goes to previous turn', async () => {
      const mockCombat = createMockCombat({ started: true, turn: 2 });
      mockCombat.previousTurn.mockResolvedValue({ ...mockCombat, turn: 1 });
      mockGame.combat = mockCombat;

      const result = await previousTurnHandler({});

      expect(mockCombat.previousTurn).toHaveBeenCalled();
      expect(result.turn).toBe(1);
    });

    it('goes to previous turn in specified combat', async () => {
      const mockCombat = createMockCombat({ started: true });
      mockGame.combats.get.mockReturnValue(mockCombat);

      await previousTurnHandler({ combatId: 'combat-123' });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.previousTurn).toHaveBeenCalled();
    });
  });

  describe('getCombatStateHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(getCombatStateHandler({})).rejects.toThrow('No active combat');
    });

    it('returns current combat state', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat({
        round: 3,
        turn: 2,
        started: true,
        combatant: mockCombatant
      });
      mockGame.combat = mockCombat;

      const result = await getCombatStateHandler({});

      expect(result).toEqual({
        id: 'combat-123',
        round: 3,
        turn: 2,
        started: true,
        combatants: expect.any(Array),
        current: {
          id: 'combatant-123',
          actorId: 'actor-456',
          tokenId: 'token-789',
          name: 'Test Fighter',
          img: 'icons/fighter.png',
          initiative: 15,
          defeated: false,
          hidden: false
        }
      });
    });

    it('returns state for specified combat', async () => {
      const mockCombat = createMockCombat();
      mockGame.combats.get.mockReturnValue(mockCombat);

      await getCombatStateHandler({ combatId: 'combat-123' });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
    });

    it('returns null current when no active combatant', async () => {
      const mockCombat = createMockCombat({ combatant: null });
      mockGame.combat = mockCombat;

      const result = await getCombatStateHandler({});

      expect(result.current).toBeNull();
    });
  });

  describe('rollInitiativeHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(
        rollInitiativeHandler({ combatantIds: ['combatant-123'] })
      ).rejects.toThrow('No active combat');
    });

    it('throws error when no combatant IDs provided', async () => {
      const mockCombat = createMockCombat();
      mockGame.combat = mockCombat;

      await expect(
        rollInitiativeHandler({ combatantIds: [] })
      ).rejects.toThrow('No combatant IDs provided');
    });

    it('throws error when combatant not found', async () => {
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(undefined);
      mockGame.combat = mockCombat;

      await expect(
        rollInitiativeHandler({ combatantIds: ['nonexistent'] })
      ).rejects.toThrow('Combatant not found: nonexistent');
    });

    it('rolls initiative for specified combatants', async () => {
      const mockCombatant = createMockCombatant({ initiative: 18 });
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await rollInitiativeHandler({
        combatantIds: ['combatant-123']
      });

      expect(mockCombat.rollInitiative).toHaveBeenCalledWith(
        ['combatant-123'],
        {}
      );
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        combatantId: 'combatant-123',
        name: 'Test Fighter',
        initiative: 18
      });
    });

    it('rolls initiative with custom formula', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      await rollInitiativeHandler({
        combatantIds: ['combatant-123'],
        formula: '2d6+5'
      });

      expect(mockCombat.rollInitiative).toHaveBeenCalledWith(
        ['combatant-123'],
        { formula: '2d6+5' }
      );
    });

    it('rolls initiative for multiple combatants', async () => {
      const combatant1 = createMockCombatant({ id: 'c1', name: 'Fighter', initiative: 15 });
      const combatant2 = createMockCombatant({ id: 'c2', name: 'Wizard', initiative: 12 });
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockImplementation((id: string) => {
        if (id === 'c1') return combatant1;
        if (id === 'c2') return combatant2;
        return undefined;
      });
      mockGame.combat = mockCombat;

      const result = await rollInitiativeHandler({
        combatantIds: ['c1', 'c2']
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.name).toBe('Fighter');
      expect(result.results[1]?.name).toBe('Wizard');
    });

    it('rolls initiative in specified combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combats.get.mockReturnValue(mockCombat);

      await rollInitiativeHandler({
        combatId: 'combat-123',
        combatantIds: ['combatant-123']
      });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.rollInitiative).toHaveBeenCalled();
    });
  });

  describe('setInitiativeHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(
        setInitiativeHandler({ combatantId: 'combatant-123', initiative: 20 })
      ).rejects.toThrow('No active combat');
    });

    it('throws error when combatant not found', async () => {
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(undefined);
      mockGame.combat = mockCombat;

      await expect(
        setInitiativeHandler({ combatantId: 'nonexistent', initiative: 20 })
      ).rejects.toThrow('Combatant not found: nonexistent');
    });

    it('sets initiative for combatant', async () => {
      const mockCombatant = createMockCombatant({ initiative: 20 });
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await setInitiativeHandler({
        combatantId: 'combatant-123',
        initiative: 20
      });

      expect(mockCombat.setInitiative).toHaveBeenCalledWith('combatant-123', 20);
      expect(result).toEqual({
        id: 'combatant-123',
        actorId: 'actor-456',
        tokenId: 'token-789',
        name: 'Test Fighter',
        img: 'icons/fighter.png',
        initiative: 20,
        defeated: false,
        hidden: false
      });
    });

    it('sets initiative in specified combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combats.get.mockReturnValue(mockCombat);

      await setInitiativeHandler({
        combatId: 'combat-123',
        combatantId: 'combatant-123',
        initiative: 15
      });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.setInitiative).toHaveBeenCalledWith('combatant-123', 15);
    });
  });

  describe('rollAllInitiativeHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(rollAllInitiativeHandler({})).rejects.toThrow('No active combat');
    });

    it('returns empty results when no combatants', async () => {
      const mockCombat = createMockCombat();
      mockCombat.combatants.contents = [];
      mockGame.combat = mockCombat;

      const result = await rollAllInitiativeHandler({});

      expect(result.results).toEqual([]);
      expect(mockCombat.rollAll).not.toHaveBeenCalled();
    });

    it('rolls initiative for all combatants', async () => {
      const combatant1 = createMockCombatant({ id: 'c1', name: 'Fighter', initiative: 15 });
      const combatant2 = createMockCombatant({ id: 'c2', name: 'Wizard', initiative: 12 });
      const mockCombat = createMockCombat();
      mockCombat.combatants.contents = [combatant1, combatant2];
      mockGame.combat = mockCombat;

      const result = await rollAllInitiativeHandler({});

      expect(mockCombat.rollAll).toHaveBeenCalledWith({});
      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.name).toBe('Fighter');
      expect(result.results[1]?.name).toBe('Wizard');
    });

    it('rolls initiative with custom formula', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.contents = [mockCombatant];
      mockGame.combat = mockCombat;

      await rollAllInitiativeHandler({ formula: '2d6+5' });

      expect(mockCombat.rollAll).toHaveBeenCalledWith({ formula: '2d6+5' });
    });

    it('rolls initiative for NPCs only', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.contents = [mockCombatant];
      mockGame.combat = mockCombat;

      await rollAllInitiativeHandler({ npcsOnly: true });

      expect(mockCombat.rollNPC).toHaveBeenCalledWith({});
      expect(mockCombat.rollAll).not.toHaveBeenCalled();
    });

    it('filters out combatants without initiative', async () => {
      const combatant1 = createMockCombatant({ id: 'c1', name: 'Fighter', initiative: 15 });
      const combatant2 = createMockCombatant({ id: 'c2', name: 'Wizard', initiative: null });
      const mockCombat = createMockCombat();
      mockCombat.combatants.contents = [combatant1, combatant2];
      mockGame.combat = mockCombat;

      const result = await rollAllInitiativeHandler({});

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.name).toBe('Fighter');
    });

    it('rolls in specified combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.contents = [mockCombatant];
      mockGame.combats.get.mockReturnValue(mockCombat);

      await rollAllInitiativeHandler({ combatId: 'combat-123' });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombat.rollAll).toHaveBeenCalled();
    });
  });

  describe('updateCombatantHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(
        updateCombatantHandler({ combatantId: 'combatant-123' })
      ).rejects.toThrow('No active combat');
    });

    it('throws error when combatant not found', async () => {
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(undefined);
      mockGame.combat = mockCombat;

      await expect(
        updateCombatantHandler({ combatantId: 'nonexistent' })
      ).rejects.toThrow('Combatant not found: nonexistent');
    });

    it('updates initiative', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await updateCombatantHandler({
        combatantId: 'combatant-123',
        initiative: 20
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({ initiative: 20 });
      expect(result.initiative).toBe(20);
    });

    it('updates defeated status', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await updateCombatantHandler({
        combatantId: 'combatant-123',
        defeated: true
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({ defeated: true });
      expect(result.defeated).toBe(true);
    });

    it('updates hidden status', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await updateCombatantHandler({
        combatantId: 'combatant-123',
        hidden: true
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({ hidden: true });
      expect(result.hidden).toBe(true);
    });

    it('updates multiple properties', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      await updateCombatantHandler({
        combatantId: 'combatant-123',
        initiative: 20,
        defeated: true,
        hidden: true
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({
        initiative: 20,
        defeated: true,
        hidden: true
      });
    });

    it('returns current state when no updates provided', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await updateCombatantHandler({
        combatantId: 'combatant-123'
      });

      expect(mockCombatant.update).not.toHaveBeenCalled();
      expect(result.id).toBe('combatant-123');
    });

    it('updates in specified combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combats.get.mockReturnValue(mockCombat);

      await updateCombatantHandler({
        combatId: 'combat-123',
        combatantId: 'combatant-123',
        defeated: true
      });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombatant.update).toHaveBeenCalled();
    });
  });

  describe('setCombatantDefeatedHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(
        setCombatantDefeatedHandler({ combatantId: 'combatant-123', defeated: true })
      ).rejects.toThrow('No active combat');
    });

    it('throws error when combatant not found', async () => {
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(undefined);
      mockGame.combat = mockCombat;

      await expect(
        setCombatantDefeatedHandler({ combatantId: 'nonexistent', defeated: true })
      ).rejects.toThrow('Combatant not found: nonexistent');
    });

    it('marks combatant as defeated', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await setCombatantDefeatedHandler({
        combatantId: 'combatant-123',
        defeated: true
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({ defeated: true });
      expect(result.defeated).toBe(true);
    });

    it('marks combatant as not defeated', async () => {
      const mockCombatant = createMockCombatant({ defeated: true });
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await setCombatantDefeatedHandler({
        combatantId: 'combatant-123',
        defeated: false
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({ defeated: false });
      expect(result.defeated).toBe(false);
    });

    it('updates in specified combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combats.get.mockReturnValue(mockCombat);

      await setCombatantDefeatedHandler({
        combatId: 'combat-123',
        combatantId: 'combatant-123',
        defeated: true
      });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
    });
  });

  describe('toggleCombatantVisibilityHandler', () => {
    it('throws error when no active combat', async () => {
      mockGame.combat = null;

      await expect(
        toggleCombatantVisibilityHandler({ combatantId: 'combatant-123' })
      ).rejects.toThrow('No active combat');
    });

    it('throws error when combatant not found', async () => {
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(undefined);
      mockGame.combat = mockCombat;

      await expect(
        toggleCombatantVisibilityHandler({ combatantId: 'nonexistent' })
      ).rejects.toThrow('Combatant not found: nonexistent');
    });

    it('hides visible combatant', async () => {
      const mockCombatant = createMockCombatant({ hidden: false });
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await toggleCombatantVisibilityHandler({
        combatantId: 'combatant-123'
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({ hidden: true });
      expect(result.hidden).toBe(true);
    });

    it('shows hidden combatant', async () => {
      const mockCombatant = createMockCombatant({ hidden: true });
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combat = mockCombat;

      const result = await toggleCombatantVisibilityHandler({
        combatantId: 'combatant-123'
      });

      expect(mockCombatant.update).toHaveBeenCalledWith({ hidden: false });
      expect(result.hidden).toBe(false);
    });

    it('toggles in specified combat', async () => {
      const mockCombatant = createMockCombatant();
      const mockCombat = createMockCombat();
      mockCombat.combatants.get.mockReturnValue(mockCombatant);
      mockGame.combats.get.mockReturnValue(mockCombat);

      await toggleCombatantVisibilityHandler({
        combatId: 'combat-123',
        combatantId: 'combatant-123'
      });

      expect(mockGame.combats.get).toHaveBeenCalledWith('combat-123');
      expect(mockCombatant.update).toHaveBeenCalled();
    });
  });
});