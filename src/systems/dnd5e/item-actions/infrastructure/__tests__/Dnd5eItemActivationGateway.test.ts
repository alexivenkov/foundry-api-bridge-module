import { Dnd5eItemActivationGateway } from '../Dnd5eItemActivationGateway';
import type { ActivateItemOptions } from '@/systems/dnd5e/item-actions/domain';
import { ActorNotFoundError } from '@/systems/shared/domain/errors';

const usageResult = {
  rolls: [
    {
      total: 18,
      formula: '1d20+5',
      terms: [{ faces: 20, number: 1, results: [{ result: 13 }] }],
      isCritical: false,
      isFumble: false
    }
  ],
  message: { id: 'chat-1' }
};

const abilityTemplate = { prototype: { drawPreview: jest.fn() } };
const scene = { createEmbeddedDocuments: jest.fn().mockResolvedValue([]) };

function setGlobals(item: unknown): void {
  const actor = { id: 'a1', name: 'Hero', items: { get: jest.fn().mockReturnValue(item) } };
  (globalThis as Record<string, unknown>)['game'] = { actors: { get: jest.fn().mockReturnValue(actor) } };
  (globalThis as Record<string, unknown>)['canvas'] = { tokens: { get: jest.fn() }, scene };
  (globalThis as Record<string, unknown>)['dnd5e'] = { canvas: { AbilityTemplate: abilityTemplate } };
}

function weapon(use: jest.Mock) {
  const activity = { _id: 'act-1', name: 'Attack', type: 'attack', use };
  return {
    id: 'i1',
    name: 'Sword',
    type: 'weapon',
    system: {
      activities: {
        contents: [activity],
        get: jest.fn().mockReturnValue(activity),
        find: jest.fn().mockReturnValue(activity)
      }
    },
    use: jest.fn(),
    displayCard: jest.fn()
  };
}

const noOpts: ActivateItemOptions = {
  activityId: undefined,
  activityType: undefined,
  templatePosition: undefined,
  spellLevel: undefined
};

describe('Dnd5eItemActivationGateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the activity, suppresses the template, and maps the outcome', async () => {
    const use = jest.fn().mockResolvedValue(usageResult);
    setGlobals(weapon(use));

    const outcome = await new Dnd5eItemActivationGateway().activate('a1', 'i1', noOpts);

    expect(use).toHaveBeenCalledWith({ create: { measuredTemplate: false } });
    expect(outcome.activityUsed).toEqual({ id: 'act-1', name: 'Attack', type: 'attack' });
    expect(outcome.rolls).toHaveLength(1);
    expect(outcome.chatMessageId).toBe('chat-1');
  });

  it('uses undefined config (no suppression) when templatePosition is provided', async () => {
    const use = jest.fn().mockResolvedValue(null);
    setGlobals(weapon(use));

    await new Dnd5eItemActivationGateway().activate('a1', 'i1', {
      ...noOpts,
      templatePosition: { x: 5, y: 5 }
    });

    expect(use).toHaveBeenCalledWith(undefined);
  });

  it('adds the spell slot when spellLevel is provided', async () => {
    const use = jest.fn().mockResolvedValue(null);
    setGlobals(weapon(use));

    await new Dnd5eItemActivationGateway().activate('a1', 'i1', { ...noOpts, spellLevel: 3 });

    expect(use).toHaveBeenCalledWith({
      create: { measuredTemplate: false },
      spell: { slot: 'spell3' }
    });
  });

  it('falls back to item.use when there is no activity, omitting activityUsed', async () => {
    const itemUse = jest.fn().mockResolvedValue(null);
    const potion = {
      id: 'i2',
      name: 'Potion',
      type: 'consumable',
      system: {},
      use: itemUse,
      displayCard: jest.fn()
    };
    setGlobals(potion);

    const outcome = await new Dnd5eItemActivationGateway().activate('a1', 'i2', noOpts);

    expect(itemUse).toHaveBeenCalledWith({ create: { measuredTemplate: false } });
    expect(outcome.activityUsed).toBeUndefined();
  });

  it('throws ActorNotFoundError / ItemNotFoundError', async () => {
    (globalThis as Record<string, unknown>)['game'] = {
      actors: { get: jest.fn().mockReturnValue(undefined) }
    };
    await expect(
      new Dnd5eItemActivationGateway().activate('missing', 'i1', noOpts)
    ).rejects.toThrow(ActorNotFoundError);

    setGlobals(undefined);
    await expect(
      new Dnd5eItemActivationGateway().activate('a1', 'missing', noOpts)
    ).rejects.toThrow('Item not found: missing');
  });
});
