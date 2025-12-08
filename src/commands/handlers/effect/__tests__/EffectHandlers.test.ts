const mockEffect1 = {
  _id: 'effect-001',
  name: 'Bless',
  img: 'icons/magic/holy/bless.png',
  disabled: false,
  origin: 'Item.spell-123',
  transfer: false,
  statuses: new Set<string>(),
  changes: [
    { key: 'system.bonuses.abilities.save', value: '1d4', mode: 2 }
  ],
  duration: { rounds: 10 },
  flags: {},
  update: jest.fn(),
  delete: jest.fn()
};

const mockEffect2 = {
  _id: 'effect-002',
  name: 'Prone',
  img: 'icons/conditions/prone.png',
  disabled: false,
  origin: null,
  transfer: false,
  statuses: new Set(['prone']),
  changes: [],
  duration: {},
  flags: {},
  update: jest.fn(),
  delete: jest.fn()
};

const mockDisabledEffect = {
  _id: 'effect-003',
  name: 'Shield of Faith',
  img: 'icons/magic/shield.png',
  disabled: true,
  origin: 'Item.spell-456',
  transfer: false,
  statuses: new Set<string>(),
  changes: [
    { key: 'system.attributes.ac.bonus', value: '2', mode: 2 }
  ],
  duration: { seconds: 600 },
  flags: {},
  update: jest.fn(),
  delete: jest.fn()
};

const mockEffectsCollection = {
  contents: [mockEffect1, mockEffect2, mockDisabledEffect],
  get: jest.fn()
};

const mockActor = {
  id: 'actor-123',
  name: 'Test Hero',
  effects: mockEffectsCollection,
  statuses: new Set(['prone']),
  toggleStatusEffect: jest.fn(),
  createEmbeddedDocuments: jest.fn()
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { getActorEffectsHandler } from '../GetActorEffectsHandler';
import { toggleActorStatusHandler } from '../ToggleActorStatusHandler';
import { addActorEffectHandler } from '../AddActorEffectHandler';
import { removeActorEffectHandler } from '../RemoveActorEffectHandler';
import { updateActorEffectHandler } from '../UpdateActorEffectHandler';

describe('getActorEffectsHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
  });

  describe('successful queries', () => {
    it('should return all effects for an actor', async () => {
      const result = await getActorEffectsHandler({ actorId: 'actor-123' });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(result.actorId).toBe('actor-123');
      expect(result.actorName).toBe('Test Hero');
      expect(result.effects).toHaveLength(3);
      expect(result.activeStatuses).toContain('prone');
    });

    it('should map effect properties correctly', async () => {
      const result = await getActorEffectsHandler({ actorId: 'actor-123' });

      const bless = result.effects.find(e => e.id === 'effect-001');
      expect(bless).toEqual({
        id: 'effect-001',
        name: 'Bless',
        img: 'icons/magic/holy/bless.png',
        disabled: false,
        isTemporary: true,
        statuses: [],
        origin: 'Item.spell-123',
        changes: [{ key: 'system.bonuses.abilities.save', value: '1d4', mode: 2 }],
        duration: { rounds: 10 }
      });
    });

    it('should filter out disabled effects when includeDisabled is false', async () => {
      const result = await getActorEffectsHandler({
        actorId: 'actor-123',
        includeDisabled: false
      });

      expect(result.effects).toHaveLength(2);
      expect(result.effects.find(e => e.name === 'Shield of Faith')).toBeUndefined();
    });

    it('should include disabled effects by default', async () => {
      const result = await getActorEffectsHandler({ actorId: 'actor-123' });

      expect(result.effects).toHaveLength(3);
      const shieldOfFaith = result.effects.find(e => e.name === 'Shield of Faith');
      expect(shieldOfFaith?.disabled).toBe(true);
    });

    it('should convert statuses Set to array', async () => {
      const result = await getActorEffectsHandler({ actorId: 'actor-123' });

      const prone = result.effects.find(e => e.name === 'Prone');
      expect(prone?.statuses).toEqual(['prone']);
    });

    it('should return empty array for actor with no effects', async () => {
      mockGame.actors.get.mockReturnValue({
        id: 'empty-actor',
        name: 'Empty Actor',
        effects: { contents: [] },
        statuses: new Set()
      });

      const result = await getActorEffectsHandler({ actorId: 'empty-actor' });

      expect(result.effects).toHaveLength(0);
      expect(result.activeStatuses).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should reject if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(getActorEffectsHandler({ actorId: 'non-existent' })).rejects.toThrow(
        'Actor not found: non-existent'
      );
    });
  });
});

describe('toggleActorStatusHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
  });

  describe('successful toggles', () => {
    it('should toggle status and return active true when effect created', async () => {
      mockActor.toggleStatusEffect.mockResolvedValue({
        _id: 'new-effect-id',
        name: 'Stunned'
      });

      const result = await toggleActorStatusHandler({
        actorId: 'actor-123',
        statusId: 'stunned'
      });

      expect(result.actorId).toBe('actor-123');
      expect(result.statusId).toBe('stunned');
      expect(result.active).toBe(true);
      expect(result.effectId).toBe('new-effect-id');
    });

    it('should return active true when effect already existed', async () => {
      mockActor.toggleStatusEffect.mockResolvedValue(true);

      const result = await toggleActorStatusHandler({
        actorId: 'actor-123',
        statusId: 'prone'
      });

      expect(result.active).toBe(true);
      expect(result.effectId).toBeUndefined();
    });

    it('should return active false when effect was removed', async () => {
      mockActor.toggleStatusEffect.mockResolvedValue(false);

      const result = await toggleActorStatusHandler({
        actorId: 'actor-123',
        statusId: 'prone'
      });

      expect(result.active).toBe(false);
      expect(result.effectId).toBeUndefined();
    });

    it('should pass active option to toggleStatusEffect', async () => {
      mockActor.toggleStatusEffect.mockResolvedValue(true);

      await toggleActorStatusHandler({
        actorId: 'actor-123',
        statusId: 'blinded',
        active: true
      });

      expect(mockActor.toggleStatusEffect).toHaveBeenCalledWith('blinded', { active: true });
    });

    it('should pass overlay option to toggleStatusEffect', async () => {
      mockActor.toggleStatusEffect.mockResolvedValue(true);

      await toggleActorStatusHandler({
        actorId: 'actor-123',
        statusId: 'dead',
        overlay: true
      });

      expect(mockActor.toggleStatusEffect).toHaveBeenCalledWith('dead', { overlay: true });
    });

    it('should pass both options to toggleStatusEffect', async () => {
      mockActor.toggleStatusEffect.mockResolvedValue(true);

      await toggleActorStatusHandler({
        actorId: 'actor-123',
        statusId: 'unconscious',
        active: true,
        overlay: true
      });

      expect(mockActor.toggleStatusEffect).toHaveBeenCalledWith('unconscious', {
        active: true,
        overlay: true
      });
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        toggleActorStatusHandler({ actorId: 'non-existent', statusId: 'prone' })
      ).rejects.toThrow('Actor not found: non-existent');
    });
  });
});

describe('addActorEffectHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.createEmbeddedDocuments.mockResolvedValue([
      { _id: 'new-effect-123', name: 'Custom Effect' }
    ]);
  });

  describe('successful creation', () => {
    it('should create effect with required name', async () => {
      const result = await addActorEffectHandler({
        actorId: 'actor-123',
        name: 'Custom Buff'
      });

      expect(mockActor.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
        { name: 'Custom Buff' }
      ]);
      expect(result.actorId).toBe('actor-123');
      expect(result.effectId).toBe('new-effect-123');
      expect(result.name).toBe('Custom Effect');
    });

    it('should create effect with all optional properties', async () => {
      await addActorEffectHandler({
        actorId: 'actor-123',
        name: 'Full Effect',
        img: 'icons/custom.png',
        disabled: true,
        origin: 'Actor.actor-123',
        statuses: ['custom-status'],
        changes: [{ key: 'system.attributes.hp.temp', value: '10', mode: 2 }],
        duration: { rounds: 5, turns: 1 }
      });

      expect(mockActor.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
        {
          name: 'Full Effect',
          img: 'icons/custom.png',
          disabled: true,
          origin: 'Actor.actor-123',
          statuses: ['custom-status'],
          changes: [{ key: 'system.attributes.hp.temp', value: '10', mode: 2 }],
          duration: { rounds: 5, turns: 1 }
        }
      ]);
    });

    it('should not include undefined optional properties', async () => {
      await addActorEffectHandler({
        actorId: 'actor-123',
        name: 'Simple Effect'
      });

      const callArg = mockActor.createEmbeddedDocuments.mock.calls[0]?.[1]?.[0];
      expect(callArg).toEqual({ name: 'Simple Effect' });
      expect(callArg).not.toHaveProperty('img');
      expect(callArg).not.toHaveProperty('disabled');
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        addActorEffectHandler({ actorId: 'non-existent', name: 'Effect' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if creation returns empty array', async () => {
      mockActor.createEmbeddedDocuments.mockResolvedValue([]);

      await expect(
        addActorEffectHandler({ actorId: 'actor-123', name: 'Effect' })
      ).rejects.toThrow('Failed to create effect');
    });

    it('should throw error if creation returns null', async () => {
      mockActor.createEmbeddedDocuments.mockResolvedValue(null);

      await expect(
        addActorEffectHandler({ actorId: 'actor-123', name: 'Effect' })
      ).rejects.toThrow('Failed to create effect');
    });
  });
});

describe('removeActorEffectHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockEffectsCollection.get.mockReturnValue(mockEffect1);
    mockEffect1.delete.mockResolvedValue(mockEffect1);
  });

  describe('successful removal', () => {
    it('should delete effect and return success', async () => {
      const result = await removeActorEffectHandler({
        actorId: 'actor-123',
        effectId: 'effect-001'
      });

      expect(mockEffectsCollection.get).toHaveBeenCalledWith('effect-001');
      expect(mockEffect1.delete).toHaveBeenCalled();
      expect(result.actorId).toBe('actor-123');
      expect(result.effectId).toBe('effect-001');
      expect(result.removed).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        removeActorEffectHandler({ actorId: 'non-existent', effectId: 'effect-001' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if effect not found', async () => {
      mockEffectsCollection.get.mockReturnValue(undefined);

      await expect(
        removeActorEffectHandler({ actorId: 'actor-123', effectId: 'non-existent' })
      ).rejects.toThrow('Effect not found: non-existent');
    });
  });
});

describe('updateActorEffectHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockEffectsCollection.get.mockReturnValue(mockEffect1);
    mockEffect1.update.mockResolvedValue({ ...mockEffect1, name: 'Updated Effect' });
  });

  describe('successful updates', () => {
    it('should update effect name', async () => {
      const result = await updateActorEffectHandler({
        actorId: 'actor-123',
        effectId: 'effect-001',
        name: 'New Name'
      });

      expect(mockEffect1.update).toHaveBeenCalledWith({ name: 'New Name' });
      expect(result.actorId).toBe('actor-123');
      expect(result.effectId).toBe('effect-001');
      expect(result.name).toBe('Updated Effect');
    });

    it('should update effect disabled state', async () => {
      await updateActorEffectHandler({
        actorId: 'actor-123',
        effectId: 'effect-001',
        disabled: true
      });

      expect(mockEffect1.update).toHaveBeenCalledWith({ disabled: true });
    });

    it('should update effect changes', async () => {
      const newChanges = [{ key: 'system.attributes.ac.value', value: '5', mode: 2 }];

      await updateActorEffectHandler({
        actorId: 'actor-123',
        effectId: 'effect-001',
        changes: newChanges
      });

      expect(mockEffect1.update).toHaveBeenCalledWith({ changes: newChanges });
    });

    it('should update multiple properties at once', async () => {
      await updateActorEffectHandler({
        actorId: 'actor-123',
        effectId: 'effect-001',
        name: 'Multi Update',
        disabled: true,
        img: 'new-icon.png',
        duration: { rounds: 20 }
      });

      expect(mockEffect1.update).toHaveBeenCalledWith({
        name: 'Multi Update',
        disabled: true,
        img: 'new-icon.png',
        duration: { rounds: 20 }
      });
    });

    it('should not include undefined properties in update', async () => {
      await updateActorEffectHandler({
        actorId: 'actor-123',
        effectId: 'effect-001',
        name: 'Only Name'
      });

      const callArg = mockEffect1.update.mock.calls[0]?.[0];
      expect(callArg).toEqual({ name: 'Only Name' });
      expect(callArg).not.toHaveProperty('disabled');
      expect(callArg).not.toHaveProperty('img');
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        updateActorEffectHandler({ actorId: 'non-existent', effectId: 'effect-001' })
      ).rejects.toThrow('Actor not found: non-existent');
    });

    it('should throw error if effect not found', async () => {
      mockEffectsCollection.get.mockReturnValue(undefined);

      await expect(
        updateActorEffectHandler({ actorId: 'actor-123', effectId: 'non-existent' })
      ).rejects.toThrow('Effect not found: non-existent');
    });
  });
});