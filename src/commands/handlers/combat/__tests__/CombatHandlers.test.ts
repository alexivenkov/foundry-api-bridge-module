import { createCombatHandler } from '../CreateCombatHandler';
import { addCombatantHandler } from '../AddCombatantHandler';

interface MockCombatant {
  id: string;
  actorId: string;
  tokenId: string | null;
  name: string;
  img: string;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
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
}

const createMockCombatant = (overrides: Partial<MockCombatant> = {}): MockCombatant => ({
  id: 'combatant-123',
  actorId: 'actor-456',
  tokenId: 'token-789',
  name: 'Test Fighter',
  img: 'icons/fighter.png',
  initiative: 15,
  defeated: false,
  hidden: false,
  ...overrides
});

const createMockCombat = (overrides: Partial<MockCombat> = {}): MockCombat => {
  const mockCombatant = createMockCombatant();
  return {
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
    ...overrides
  };
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
});