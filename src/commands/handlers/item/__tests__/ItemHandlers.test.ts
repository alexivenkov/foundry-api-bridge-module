const mockActivity = {
  _id: 'activity-123',
  name: 'Attack',
  type: 'attack',
  use: jest.fn()
};

const mockActivitiesCollection = {
  contents: [mockActivity],
  get: jest.fn(),
  find: jest.fn()
};

const mockWeapon = {
  id: 'weapon-123',
  name: 'Longsword',
  type: 'weapon',
  img: 'icons/weapons/swords/sword.png',
  system: {
    activities: mockActivitiesCollection,
    equipped: true,
    quantity: 1
  },
  use: jest.fn(),
  displayCard: jest.fn()
};

const mockArmor = {
  id: 'armor-456',
  name: 'Chain Mail',
  type: 'equipment',
  img: 'icons/armor/chest/chainmail.png',
  system: {
    equipped: true,
    quantity: 1
  },
  use: jest.fn(),
  displayCard: jest.fn()
};

const mockPotion = {
  id: 'potion-789',
  name: 'Healing Potion',
  type: 'consumable',
  img: 'icons/consumables/potions/potion-red.png',
  system: {
    equipped: false,
    quantity: 3
  },
  use: jest.fn(),
  displayCard: jest.fn()
};

const mockActor = {
  id: 'actor-123',
  name: 'Test Hero',
  items: {
    contents: [mockWeapon, mockArmor, mockPotion],
    get: jest.fn()
  }
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { getActorItemsHandler } from '../GetActorItemsHandler';
import { useItemHandler } from '../UseItemHandler';

describe('getActorItemsHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
  });

  describe('successful queries', () => {
    it('should return all items for an actor', async () => {
      const result = await getActorItemsHandler({ actorId: 'actor-123' });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(result.actorId).toBe('actor-123');
      expect(result.actorName).toBe('Test Hero');
      expect(result.items).toHaveLength(3);
    });

    it('should return item details with activity info', async () => {
      const result = await getActorItemsHandler({ actorId: 'actor-123' });

      const sword = result.items.find(i => i.id === 'weapon-123');
      expect(sword).toEqual({
        id: 'weapon-123',
        name: 'Longsword',
        type: 'weapon',
        img: 'icons/weapons/swords/sword.png',
        equipped: true,
        quantity: 1,
        hasActivities: true,
        activityTypes: ['attack']
      });
    });

    it('should filter items by type', async () => {
      const result = await getActorItemsHandler({
        actorId: 'actor-123',
        type: 'weapon'
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Longsword');
    });

    it('should filter items by equipped status', async () => {
      const result = await getActorItemsHandler({
        actorId: 'actor-123',
        equipped: true
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map(i => i.name)).toContain('Longsword');
      expect(result.items.map(i => i.name)).toContain('Chain Mail');
    });

    it('should filter items by hasActivities', async () => {
      const result = await getActorItemsHandler({
        actorId: 'actor-123',
        hasActivities: true
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Longsword');
    });

    it('should return empty array for actor with no items', async () => {
      mockGame.actors.get.mockReturnValue({
        id: 'empty-actor',
        name: 'Empty Actor',
        items: { contents: [] }
      });

      const result = await getActorItemsHandler({ actorId: 'empty-actor' });

      expect(result.items).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should reject if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(getActorItemsHandler({ actorId: 'non-existent' })).rejects.toThrow(
        'Actor not found: non-existent'
      );
    });
  });
});

describe('useItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.items.get.mockReturnValue(mockWeapon);
    mockActivitiesCollection.get.mockReturnValue(mockActivity);
    mockActivitiesCollection.find.mockReturnValue(mockActivity);
    mockActivity.use.mockResolvedValue({
      rolls: [
        {
          total: 18,
          formula: '1d20 + 5',
          terms: [{ faces: 20, number: 1, results: [{ result: 13 }] }],
          isCritical: false,
          isFumble: false
        }
      ],
      message: { id: 'msg-123' }
    });
  });

  describe('successful usage', () => {
    it('should use item with first activity', async () => {
      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.itemId).toBe('weapon-123');
      expect(result.itemName).toBe('Longsword');
      expect(result.itemType).toBe('weapon');
      expect(result.activityUsed).toEqual({
        id: 'activity-123',
        name: 'Attack',
        type: 'attack'
      });
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0]?.total).toBe(18);
    });

    it('should use specific activity by id', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        activityId: 'activity-123'
      });

      expect(mockActivitiesCollection.get).toHaveBeenCalledWith('activity-123');
    });

    it('should use specific activity by type', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        activityType: 'attack'
      });

      expect(mockActivitiesCollection.find).toHaveBeenCalled();
    });

    it('should pass consume option to activity.use', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        consume: false
      });

      expect(mockActivity.use).toHaveBeenCalledWith(
        {
          consume: false,
          scaling: false,
          concentration: { begin: false },
          create: { measuredTemplate: false },
          event: { shiftKey: true }
        },
        { configure: false },
        { create: false }
      );
    });

    it('should pass scaling option to activity.use', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        scaling: 3
      });

      expect(mockActivity.use).toHaveBeenCalledWith(
        {
          consume: { resources: true, spellSlot: true },
          scaling: 3,
          concentration: { begin: false },
          create: { measuredTemplate: false },
          event: { shiftKey: true }
        },
        { configure: false },
        { create: false }
      );
    });

    it('should create chat message when showInChat is true', async () => {
      await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        showInChat: true
      });

      expect(mockActivity.use).toHaveBeenCalledWith(
        {
          consume: { resources: true, spellSlot: true },
          scaling: false,
          concentration: { begin: false },
          create: { measuredTemplate: false },
          event: { shiftKey: true }
        },
        { configure: false },
        { create: true }
      );
    });

    it('should return chatMessageId when available', async () => {
      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.chatMessageId).toBe('msg-123');
    });

    it('should extract dice results from rolls', async () => {
      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls[0]?.dice).toEqual([
        { type: 'd20', count: 1, results: [13] }
      ]);
    });

    it('should handle item with no activities by calling displayCard', async () => {
      mockActor.items.get.mockReturnValue(mockPotion);
      mockPotion.displayCard.mockResolvedValue({ id: 'card-msg-123' });

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'potion-789'
      });

      expect(mockPotion.displayCard).toHaveBeenCalledWith({ create: false });
      expect(result.itemName).toBe('Healing Potion');
      expect(result.activityUsed).toBeUndefined();
      expect(result.rolls).toHaveLength(0);
    });

    it('should handle activity.use returning null', async () => {
      mockActivity.use.mockResolvedValue(null);

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls).toHaveLength(0);
      expect(result.chatMessageId).toBeUndefined();
    });

    it('should detect critical hits', async () => {
      mockActivity.use.mockResolvedValue({
        rolls: [
          {
            total: 25,
            formula: '1d20 + 5',
            terms: [{ faces: 20, number: 1, results: [{ result: 20 }] }],
            isCritical: true,
            isFumble: false
          }
        ]
      });

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls[0]?.isCritical).toBe(true);
    });

    it('should detect fumbles', async () => {
      mockActivity.use.mockResolvedValue({
        rolls: [
          {
            total: 6,
            formula: '1d20 + 5',
            terms: [{ faces: 20, number: 1, results: [{ result: 1 }] }],
            isCritical: false,
            isFumble: true
          }
        ]
      });

      const result = await useItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.rolls[0]?.isFumble).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        useItemHandler({ actorId: 'non-existent', itemId: 'weapon-123' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if item not found', async () => {
      mockActor.items.get.mockReturnValue(undefined);

      await expect(
        useItemHandler({ actorId: 'actor-123', itemId: 'non-existent' })
      ).rejects.toThrow('Item not found: non-existent');
    });

    it('should throw error if activity not found by id', async () => {
      mockActivitiesCollection.get.mockReturnValue(undefined);

      await expect(
        useItemHandler({
          actorId: 'actor-123',
          itemId: 'weapon-123',
          activityId: 'non-existent'
        })
      ).rejects.toThrow('Activity not found: non-existent');
    });

    it('should throw error if activity not found by type', async () => {
      mockActivitiesCollection.find.mockReturnValue(undefined);

      await expect(
        useItemHandler({
          actorId: 'actor-123',
          itemId: 'weapon-123',
          activityType: 'heal'
        })
      ).rejects.toThrow("No activity of type 'heal' found on item: Longsword");
    });
  });
});

import { activateItemHandler } from '../ActivateItemHandler';

const mockTargetToken1 = { setTarget: jest.fn() };
const mockTargetToken2 = { setTarget: jest.fn() };
const mockExistingTarget = { setTarget: jest.fn() };

const mockScene = {
  createEmbeddedDocuments: jest.fn().mockResolvedValue([])
};

const mockCanvas = {
  tokens: { get: jest.fn() },
  scene: mockScene
};

const mockUser = {
  id: 'user-1',
  targets: new Set<{ setTarget: jest.Mock }>()
};

const mockTrapWorkflow = jest.fn();
const mockMidiQOL = {
  TrapWorkflow: mockTrapWorkflow
};

const mockModules = {
  get: jest.fn()
};

const mockHooks = {
  once: jest.fn(),
  off: jest.fn()
};

const mockUsageResult = {
  rolls: [
    { total: 18, formula: '1d20+5', terms: [{ faces: 20, number: 1, results: [{ result: 13 }] }], isCritical: false, isFumble: false }
  ],
  message: { id: 'chat-msg-123' }
};

describe('activateItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUser.targets.clear();
    mockModules.get.mockReturnValue(undefined);
    mockScene.createEmbeddedDocuments.mockResolvedValue([]);
    (globalThis as Record<string, unknown>)['game'] = { ...mockGame, user: mockUser, modules: mockModules };
    (globalThis as Record<string, unknown>)['canvas'] = mockCanvas;
    (globalThis as Record<string, unknown>)['Hooks'] = mockHooks;
    delete (globalThis as Record<string, unknown>)['MidiQOL'];
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.items.get.mockReturnValue(mockWeapon);
    mockActivitiesCollection.contents = [mockActivity];
    mockActivitiesCollection.get.mockReturnValue(undefined);
    mockActivitiesCollection.find.mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns rolls and chatMessageId from use() result', async () => {
    mockActivity.use.mockResolvedValue(mockUsageResult);

    const result = await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(result.rolls).toHaveLength(1);
    expect(result.rolls[0]?.total).toBe(18);
    expect(result.chatMessageId).toBe('chat-msg-123');
    expect(result.workflow).toBeUndefined();
  });

  it('suppresses measured template creation', async () => {
    mockActivity.use.mockResolvedValue(null);

    await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(mockActivity.use).toHaveBeenCalledWith({ create: { measuredTemplate: false } });
  });

  it('returns empty rolls when use() returns null', async () => {
    mockActivity.use.mockResolvedValue(null);

    const result = await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(result.rolls).toEqual([]);
    expect(result.chatMessageId).toBeUndefined();
  });

  it('includes activityUsed when activity exists', async () => {
    mockActivity.use.mockResolvedValue(null);

    const result = await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(result.activityUsed).toEqual({ id: 'activity-123', name: 'Attack', type: 'attack' });
  });

  it('omits activityUsed when falling back to item.use()', async () => {
    mockActivitiesCollection.contents = [];
    mockWeapon.use.mockResolvedValue(null);

    const result = await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(mockWeapon.use).toHaveBeenCalledWith({ create: { measuredTemplate: false } });
    expect(result.activityUsed).toBeUndefined();
  });

  it('resolves activity by ID', async () => {
    mockActivitiesCollection.get.mockReturnValue(mockActivity);
    mockActivity.use.mockResolvedValue(null);

    await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      activityId: 'activity-123'
    });

    expect(mockActivitiesCollection.get).toHaveBeenCalledWith('activity-123');
  });

  it('resolves activity by type', async () => {
    mockActivitiesCollection.find.mockReturnValue(mockActivity);
    mockActivity.use.mockResolvedValue(null);

    await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      activityType: 'attack'
    });

    expect(mockActivitiesCollection.find).toHaveBeenCalled();
  });

  it('sets targets before calling use()', async () => {
    mockCanvas.tokens.get.mockImplementation((id: string) => {
      if (id === 'target-1') return mockTargetToken1;
      if (id === 'target-2') return mockTargetToken2;
      return undefined;
    });
    mockActivity.use.mockResolvedValue(null);

    const result = await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      targetTokenIds: ['target-1', 'target-2']
    });

    expect(mockTargetToken1.setTarget).toHaveBeenCalledWith(true, { user: mockUser, releaseOthers: false });
    expect(mockTargetToken2.setTarget).toHaveBeenCalledWith(true, { user: mockUser, releaseOthers: false });
    expect(result.targetsSet).toBe(2);
  });

  it('clears existing targets before setting new ones', async () => {
    mockUser.targets.add(mockExistingTarget);
    mockCanvas.tokens.get.mockReturnValue(mockTargetToken1);
    mockActivity.use.mockResolvedValue(null);

    await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      targetTokenIds: ['target-1']
    });

    expect(mockExistingTarget.setTarget).toHaveBeenCalledWith(false, { user: mockUser, releaseOthers: false });
  });

  it('skips targeting when targetTokenIds not provided', async () => {
    mockActivity.use.mockResolvedValue(null);

    const result = await activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(mockCanvas.tokens.get).not.toHaveBeenCalled();
    expect(result.targetsSet).toBe(0);
  });

  it('throws when target token not found', async () => {
    mockCanvas.tokens.get.mockReturnValue(undefined);

    await expect(activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      targetTokenIds: ['nonexistent']
    })).rejects.toThrow('Target token not found: nonexistent');
  });

  describe('Midi-QOL integration', () => {
    beforeEach(() => {
      mockModules.get.mockReturnValue({ active: true });
    });

    it('listens for midi-qol.RollComplete when Midi-QOL is active', async () => {
      mockHooks.once.mockImplementation((_hook: string, callback: (wf: unknown) => void) => {
        callback({
          attackTotal: 18,
          damageTotal: 12,
          isCritical: false,
          isFumble: false,
          hitTargets: new Set([{ id: 'target-1' }]),
          saves: new Set(),
          failedSaves: new Set([{ id: 'target-1' }])
        });
        return 1;
      });
      mockActivity.use.mockResolvedValue(mockUsageResult);

      const result = await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(mockHooks.once).toHaveBeenCalledWith('midi-qol.RollComplete', expect.any(Function));
      expect(result.workflow).toEqual({
        attackTotal: 18,
        damageTotal: 12,
        isCritical: false,
        isFumble: false,
        hitTargetIds: ['target-1'],
        saveTargetIds: [],
        failedSaveTargetIds: ['target-1']
      });
    });

    it('includes critical hit in workflow', async () => {
      mockHooks.once.mockImplementation((_hook: string, callback: (wf: unknown) => void) => {
        callback({
          attackTotal: 20,
          damageTotal: 24,
          isCritical: true,
          isFumble: false,
          hitTargets: new Set([{ id: 'target-1' }]),
          saves: new Set(),
          failedSaves: new Set()
        });
        return 1;
      });
      mockActivity.use.mockResolvedValue(null);

      const result = await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.workflow?.isCritical).toBe(true);
      expect(result.workflow?.damageTotal).toBe(24);
    });

    it('includes saves and failed saves', async () => {
      mockHooks.once.mockImplementation((_hook: string, callback: (wf: unknown) => void) => {
        callback({
          hitTargets: new Set(),
          saves: new Set([{ id: 'target-1' }, { id: 'target-2' }]),
          failedSaves: new Set([{ id: 'target-3' }])
        });
        return 1;
      });
      mockActivity.use.mockResolvedValue(null);

      const result = await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(result.workflow?.saveTargetIds).toEqual(['target-1', 'target-2']);
      expect(result.workflow?.failedSaveTargetIds).toEqual(['target-3']);
    });

    it('returns undefined workflow on timeout', async () => {
      mockHooks.once.mockReturnValue(1);
      mockActivity.use.mockResolvedValue(null);

      const resultPromise = activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      jest.advanceTimersByTime(5000);
      const result = await resultPromise;

      expect(result.workflow).toBeUndefined();
    });

    it('cleans up hook listener after timeout', async () => {
      mockHooks.once.mockReturnValue(42);
      mockActivity.use.mockResolvedValue(null);

      const resultPromise = activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      jest.advanceTimersByTime(5000);
      await resultPromise;

      expect(mockHooks.off).toHaveBeenCalledWith('midi-qol.RollComplete', 42);
    });
  });

  describe('without Midi-QOL', () => {
    it('does not register hooks when Midi-QOL is inactive', async () => {
      mockModules.get.mockReturnValue({ active: false });
      mockActivity.use.mockResolvedValue(null);

      const result = await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(mockHooks.once).not.toHaveBeenCalled();
      expect(result.workflow).toBeUndefined();
    });

    it('does not register hooks when Midi-QOL module not found', async () => {
      mockModules.get.mockReturnValue(undefined);
      mockActivity.use.mockResolvedValue(null);

      const result = await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(mockHooks.once).not.toHaveBeenCalled();
      expect(result.workflow).toBeUndefined();
    });
  });

  describe('AoE template placement', () => {
    it('uses TrapWorkflow when Midi-QOL active and templatePosition provided', async () => {
      mockModules.get.mockReturnValue({ active: true });
      (globalThis as Record<string, unknown>)['MidiQOL'] = mockMidiQOL;
      mockCanvas.tokens.get.mockReturnValue(mockTargetToken1);
      mockHooks.once.mockImplementation((_hook: string, callback: (wf: unknown) => void) => {
        callback({
          damageTotal: 28,
          isCritical: false,
          isFumble: false,
          hitTargets: new Set(),
          saves: new Set([{ id: 'target-1' }]),
          failedSaves: new Set()
        });
        return 1;
      });

      const result = await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        targetTokenIds: ['target-1'],
        templatePosition: { x: 500, y: 500 }
      });

      expect(mockTrapWorkflow).toHaveBeenCalledWith(
        mockActor,
        mockWeapon,
        [mockTargetToken1],
        { x: 500, y: 500 }
      );
      expect(mockActivity.use).not.toHaveBeenCalled();
      expect(result.activated).toBe(true);
      expect(result.workflow?.damageTotal).toBe(28);
    });

    it('creates MeasuredTemplate when Midi-QOL inactive and templatePosition provided', async () => {
      mockModules.get.mockReturnValue(undefined);
      mockActivity.use.mockResolvedValue(null);

      await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        templatePosition: { x: 300, y: 400 }
      });

      expect(mockScene.createEmbeddedDocuments).toHaveBeenCalledWith('MeasuredTemplate', [{
        t: 'circle',
        x: 300,
        y: 400,
        distance: 20,
        fillColor: '#ff0000',
        author: 'user-1'
      }]);
      expect(mockActivity.use).toHaveBeenCalled();
    });

    it('skips template when templatePosition not provided', async () => {
      mockActivity.use.mockResolvedValue(null);

      await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123'
      });

      expect(mockScene.createEmbeddedDocuments).not.toHaveBeenCalled();
      expect(mockTrapWorkflow).not.toHaveBeenCalled();
    });

    it('falls back to MeasuredTemplate when MidiQOL global not available', async () => {
      mockModules.get.mockReturnValue({ active: true });
      mockActivity.use.mockResolvedValue(null);
      mockHooks.once.mockImplementation((_hook: string, callback: (wf: unknown) => void) => {
        callback({ hitTargets: new Set(), saves: new Set(), failedSaves: new Set() });
        return 1;
      });

      const result = await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        templatePosition: { x: 100, y: 200 }
      });

      expect(mockScene.createEmbeddedDocuments).toHaveBeenCalled();
      expect(mockTrapWorkflow).not.toHaveBeenCalled();
      expect(result.activated).toBe(true);
    });

    it('passes resolved target tokens to TrapWorkflow', async () => {
      mockModules.get.mockReturnValue({ active: true });
      (globalThis as Record<string, unknown>)['MidiQOL'] = mockMidiQOL;
      mockCanvas.tokens.get.mockImplementation((id: string) => {
        if (id === 'target-1') return mockTargetToken1;
        if (id === 'target-2') return mockTargetToken2;
        return undefined;
      });
      mockHooks.once.mockImplementation((_hook: string, callback: (wf: unknown) => void) => {
        callback({ hitTargets: new Set(), saves: new Set(), failedSaves: new Set() });
        return 1;
      });

      await activateItemHandler({
        actorId: 'actor-123',
        itemId: 'weapon-123',
        targetTokenIds: ['target-1', 'target-2'],
        templatePosition: { x: 500, y: 500 }
      });

      expect(mockTrapWorkflow).toHaveBeenCalledWith(
        mockActor,
        mockWeapon,
        [mockTargetToken1, mockTargetToken2],
        { x: 500, y: 500 }
      );
    });
  });

  it('throws when actor not found', async () => {
    mockGame.actors.get.mockReturnValue(undefined);

    await expect(activateItemHandler({
      actorId: 'nonexistent',
      itemId: 'weapon-123'
    })).rejects.toThrow('Actor not found: nonexistent');
  });

  it('throws when item not found', async () => {
    mockActor.items.get.mockReturnValue(undefined);

    await expect(activateItemHandler({
      actorId: 'actor-123',
      itemId: 'nonexistent'
    })).rejects.toThrow('Item not found: nonexistent');
  });

  it('throws when activity ID not found', async () => {
    mockActivitiesCollection.get.mockReturnValue(undefined);

    await expect(activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      activityId: 'nonexistent'
    })).rejects.toThrow('Activity not found: nonexistent');
  });

  it('throws when activity type not found', async () => {
    mockActivitiesCollection.find.mockReturnValue(undefined);

    await expect(activateItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      activityType: 'heal'
    })).rejects.toThrow("No activity of type 'heal' found on item: Longsword");
  });
});

// Mock for CRUD handlers
const mockCreatedItem = {
  id: 'new-item-123',
  name: 'New Sword',
  type: 'weapon',
  img: 'icons/weapons/swords/new-sword.png'
};

const mockCompendiumItem = {
  id: 'compendium-item-456',
  name: 'Compendium Sword',
  type: 'weapon',
  img: 'icons/weapons/swords/compendium-sword.png',
  toObject: jest.fn().mockReturnValue({
    name: 'Compendium Sword',
    type: 'weapon',
    img: 'icons/weapons/swords/compendium-sword.png',
    system: { quantity: 1 }
  })
};

const mockPack = {
  collection: 'dnd5e.items',
  metadata: { type: 'Item' },
  getDocument: jest.fn()
};

const mockActorWithCrud = {
  id: 'actor-123',
  name: 'Test Hero',
  items: {
    contents: [mockWeapon, mockArmor, mockPotion],
    get: jest.fn()
  },
  createEmbeddedDocuments: jest.fn(),
  updateEmbeddedDocuments: jest.fn(),
  deleteEmbeddedDocuments: jest.fn()
};

const mockGameWithPacks = {
  actors: {
    get: jest.fn()
  },
  packs: {
    get: jest.fn()
  }
};

import { addItemToActorHandler } from '../AddItemToActorHandler';
import { addItemFromCompendiumHandler } from '../AddItemFromCompendiumHandler';
import { updateActorItemHandler } from '../UpdateActorItemHandler';
import { deleteActorItemHandler } from '../DeleteActorItemHandler';

describe('addItemToActorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockActorWithCrud.createEmbeddedDocuments.mockResolvedValue([mockCreatedItem]);
  });

  it('should create item on actor', async () => {
    const result = await addItemToActorHandler({
      actorId: 'actor-123',
      name: 'New Sword',
      type: 'weapon'
    });

    expect(mockActorWithCrud.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      { name: 'New Sword', type: 'weapon' }
    ]);
    expect(result.id).toBe('new-item-123');
    expect(result.name).toBe('New Sword');
    expect(result.actorId).toBe('actor-123');
    expect(result.actorName).toBe('Test Hero');
  });

  it('should pass img and system data', async () => {
    await addItemToActorHandler({
      actorId: 'actor-123',
      name: 'Magic Sword',
      type: 'weapon',
      img: 'icons/magic-sword.png',
      system: { quantity: 2, rarity: 'rare' }
    });

    expect(mockActorWithCrud.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      {
        name: 'Magic Sword',
        type: 'weapon',
        img: 'icons/magic-sword.png',
        system: { quantity: 2, rarity: 'rare' }
      }
    ]);
  });

  it('should throw error if actor not found', async () => {
    mockGameWithPacks.actors.get.mockReturnValue(undefined);

    await expect(
      addItemToActorHandler({ actorId: 'non-existent', name: 'Sword', type: 'weapon' })
    ).rejects.toThrow('Actor not found: non-existent');
  });
});

describe('addItemFromCompendiumHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockGameWithPacks.packs.get.mockReturnValue(mockPack);
    mockPack.getDocument.mockResolvedValue(mockCompendiumItem);
    mockActorWithCrud.createEmbeddedDocuments.mockResolvedValue([{
      id: 'created-from-compendium',
      name: 'Compendium Sword',
      type: 'weapon',
      img: 'icons/weapons/swords/compendium-sword.png'
    }]);
  });

  it('should add item from compendium to actor', async () => {
    const result = await addItemFromCompendiumHandler({
      actorId: 'actor-123',
      packId: 'dnd5e.items',
      itemId: 'compendium-item-456'
    });

    expect(mockPack.getDocument).toHaveBeenCalledWith('compendium-item-456');
    expect(mockActorWithCrud.createEmbeddedDocuments).toHaveBeenCalled();
    expect(result.id).toBe('created-from-compendium');
    expect(result.actorId).toBe('actor-123');
  });

  it('should override name if provided', async () => {
    await addItemFromCompendiumHandler({
      actorId: 'actor-123',
      packId: 'dnd5e.items',
      itemId: 'compendium-item-456',
      name: 'Custom Name'
    });

    const callArgs = mockActorWithCrud.createEmbeddedDocuments.mock.calls[0] as [string, Record<string, unknown>[]];
    expect(callArgs[1][0]?.['name']).toBe('Custom Name');
  });

  it('should set quantity if provided', async () => {
    await addItemFromCompendiumHandler({
      actorId: 'actor-123',
      packId: 'dnd5e.items',
      itemId: 'compendium-item-456',
      quantity: 5
    });

    const callArgs = mockActorWithCrud.createEmbeddedDocuments.mock.calls[0] as [string, Record<string, unknown>[]];
    const system = callArgs[1][0]?.['system'] as Record<string, unknown>;
    expect(system['quantity']).toBe(5);
  });

  it('should throw error if pack not found', async () => {
    mockGameWithPacks.packs.get.mockReturnValue(undefined);

    await expect(
      addItemFromCompendiumHandler({
        actorId: 'actor-123',
        packId: 'invalid-pack',
        itemId: 'item-123'
      })
    ).rejects.toThrow('Compendium pack not found: invalid-pack');
  });

  it('should throw error if pack is not Item type', async () => {
    mockGameWithPacks.packs.get.mockReturnValue({
      ...mockPack,
      metadata: { type: 'Actor' }
    });

    await expect(
      addItemFromCompendiumHandler({
        actorId: 'actor-123',
        packId: 'dnd5e.monsters',
        itemId: 'item-123'
      })
    ).rejects.toThrow('Compendium pack is not an Item pack: dnd5e.monsters');
  });

  it('should throw error if item not found in compendium', async () => {
    mockPack.getDocument.mockResolvedValue(null);

    await expect(
      addItemFromCompendiumHandler({
        actorId: 'actor-123',
        packId: 'dnd5e.items',
        itemId: 'non-existent'
      })
    ).rejects.toThrow('Item not found in compendium: non-existent');
  });
});

describe('updateActorItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockActorWithCrud.items.get.mockReturnValue(mockWeapon);
    mockActorWithCrud.updateEmbeddedDocuments.mockResolvedValue([{
      id: 'weapon-123',
      name: 'Updated Sword',
      type: 'weapon',
      img: 'icons/updated-sword.png'
    }]);
  });

  it('should update item on actor', async () => {
    const result = await updateActorItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      name: 'Updated Sword'
    });

    expect(mockActorWithCrud.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      { _id: 'weapon-123', name: 'Updated Sword' }
    ]);
    expect(result.name).toBe('Updated Sword');
  });

  it('should update system properties using dot notation', async () => {
    await updateActorItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123',
      system: { quantity: 10 }
    });

    expect(mockActorWithCrud.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [
      { _id: 'weapon-123', 'system.quantity': 10 }
    ]);
  });

  it('should throw error if actor not found', async () => {
    mockGameWithPacks.actors.get.mockReturnValue(undefined);

    await expect(
      updateActorItemHandler({ actorId: 'non-existent', itemId: 'weapon-123' })
    ).rejects.toThrow('Actor not found: non-existent');
  });

  it('should throw error if item not found', async () => {
    mockActorWithCrud.items.get.mockReturnValue(undefined);

    await expect(
      updateActorItemHandler({ actorId: 'actor-123', itemId: 'non-existent' })
    ).rejects.toThrow('Item not found: non-existent');
  });
});

describe('deleteActorItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, unknown>)['game'] = mockGameWithPacks;
    mockGameWithPacks.actors.get.mockReturnValue(mockActorWithCrud);
    mockActorWithCrud.items.get.mockReturnValue(mockWeapon);
    mockActorWithCrud.deleteEmbeddedDocuments.mockResolvedValue([mockWeapon]);
  });

  it('should delete item from actor', async () => {
    const result = await deleteActorItemHandler({
      actorId: 'actor-123',
      itemId: 'weapon-123'
    });

    expect(mockActorWithCrud.deleteEmbeddedDocuments).toHaveBeenCalledWith('Item', ['weapon-123']);
    expect(result.deleted).toBe(true);
  });

  it('should throw error if actor not found', async () => {
    mockGameWithPacks.actors.get.mockReturnValue(undefined);

    await expect(
      deleteActorItemHandler({ actorId: 'non-existent', itemId: 'weapon-123' })
    ).rejects.toThrow('Actor not found: non-existent');
  });

  it('should throw error if item not found', async () => {
    mockActorWithCrud.items.get.mockReturnValue(undefined);

    await expect(
      deleteActorItemHandler({ actorId: 'actor-123', itemId: 'non-existent' })
    ).rejects.toThrow('Item not found: non-existent');
  });
});