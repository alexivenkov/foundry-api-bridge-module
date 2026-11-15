import type { EffectGameProvider } from '../../../../core/effects';
import { createAddActorEffectHandler } from '../AddActorEffectHandler';
import { createCreateItemEffectHandler } from '../CreateItemEffectHandler';
import { createDeleteItemEffectHandler } from '../DeleteItemEffectHandler';
import { createGetActorEffectHandler } from '../GetActorEffectHandler';
import { createGetItemEffectsHandler } from '../GetItemEffectsHandler';
import { createUpdateActorEffectHandler } from '../UpdateActorEffectHandler';
import { createUpdateItemEffectHandler } from '../UpdateItemEffectHandler';
import type { EffectHandlerDependencies } from '../effectWireMappers';

// A Foundry 14 world (stored data as the Node probe produced it): a world item
// `ring`, a hero owning `sword`, and an unlinked goblin token `t3` on the active
// scene owning `club`.

interface StoredEffect {
  _source: Record<string, unknown>;
  update: jest.Mock;
  delete: jest.Mock;
}

function storedEffect(source: Record<string, unknown>): StoredEffect {
  const effect: StoredEffect = { _source: source, update: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
  effect.update.mockImplementation((data: Record<string, unknown>) => {
    effect._source = { ...effect._source, ...data };
    return Promise.resolve(effect);
  });
  return effect;
}

const AURA_SOURCE = {
  _id: 'aura',
  name: 'Protection',
  img: 'icons/aura.svg',
  type: 'base',
  system: { changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 1, phase: 'initial', priority: null }] },
  disabled: false,
  duration: { value: null, units: 'seconds', expiry: null, expired: false },
  description: '',
  origin: null,
  tint: '#ffffff',
  transfer: true,
  statuses: [],
  showIcon: 1,
  sort: 0
};

function effectParent(id: string, name: string, effects: StoredEffect[]): Record<string, unknown> {
  return {
    id,
    name,
    effects: { contents: effects, get: (effectId: string) => effects.find((effect) => effect._source['_id'] === effectId) },
    createEmbeddedDocuments: jest.fn((_type: string, data: Record<string, unknown>[]) =>
      Promise.resolve([storedEffect({ ...AURA_SOURCE, ...data[0], _id: 'new' })])
    )
  };
}

interface World {
  deps: EffectHandlerDependencies;
  aura: StoredEffect;
  ring: Record<string, unknown>;
  club: Record<string, unknown>;
  hero: Record<string, unknown>;
}

const FOUNDRY_14_GLOBALS = {
  CONST: {
    ACTIVE_EFFECT_CHANGE_TYPES: { custom: 0, multiply: 10, add: 20, subtract: 20, downgrade: 30, upgrade: 40, override: 50 },
    ACTIVE_EFFECT_CHANGE_PHASES: ['initial', 'final'],
    ACTIVE_EFFECT_EXPIRY_EVENTS: ['combatStart', 'roundStart', 'turnStart', 'combatEnd', 'roundEnd', 'turnEnd']
  },
  CONFIG: {
    ActiveEffect: {
      changeTypes: {},
      phases: {},
      expiryEvents: {},
      documentClass: {
        schema: {
          fields: {
            origin: {
              validate: (value: unknown) =>
                typeof value === 'string' && value.startsWith('Item.') ? undefined : { message: 'must reference a valid document type' }
            }
          }
        }
      }
    }
  }
};

function world(generation = 14, activeScene = true): World {
  const aura = storedEffect({ ...AURA_SOURCE });
  const ring = effectParent('ring', 'Ring of Protection', [aura]);
  const sword = effectParent('sword', 'Flame Tongue', []);
  const club = effectParent('club', 'Club', []);
  const hero = {
    ...effectParent('a1', 'Hero', [storedEffect({ ...AURA_SOURCE, _id: 'bless', name: 'Bless', transfer: false })]),
    items: { get: (id: string) => (id === 'sword' ? sword : undefined) },
    statuses: new Set<string>(),
    toggleStatusEffect: jest.fn()
  };
  const goblin = { ...effectParent('g1', 'Goblin 3', []), items: { get: (id: string) => (id === 'club' ? club : undefined) } };
  const cave = { id: 'cave', name: 'Cave', tokens: { get: (id: string) => (id === 't3' ? { id: 't3', actor: goblin } : undefined) } };
  const game = {
    actors: { get: (id: string) => (id === 'a1' ? hero : undefined) },
    scenes: { get: (id: string) => (id === 'cave' ? cave : undefined), active: activeScene ? cave : null },
    items: { get: (id: string) => (id === 'ring' ? ring : undefined) },
    documentTypes: { ActiveEffect: ['base', 'enchantment'] }
  };
  const deps: EffectHandlerDependencies = {
    gameProvider: { getGame: () => game } as unknown as EffectGameProvider,
    globals: () => FOUNDRY_14_GLOBALS,
    generation: () => generation
  };
  return { deps, aura, ring, club, hero };
}

const AURA_WIRE = {
  id: 'aura',
  name: 'Protection',
  img: 'icons/aura.svg',
  type: 'base',
  disabled: false,
  transfer: true,
  description: '',
  tint: '#ffffff',
  origin: null,
  statuses: [],
  sort: 0,
  changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 1, priority: null, phase: 'initial' }],
  duration: null,
  showIcon: 'conditional',
  system: {}
};

describe('get-item-effects', () => {
  it('lists the effects of a world item in full', async () => {
    const result = await createGetItemEffectsHandler(world().deps)({ itemId: 'ring' });

    expect(result).toEqual({
      itemId: 'ring',
      itemName: 'Ring of Protection',
      actorId: null,
      tokenId: null,
      sceneId: null,
      effects: [AURA_WIRE]
    });
  });

  it('lists the effects of an item one token\'s own actor owns, naming the token and scene', async () => {
    const result = await createGetItemEffectsHandler(world().deps)({ itemId: 'club', tokenId: 't3' });

    expect(result).toEqual({ itemId: 'club', itemName: 'Club', actorId: 'g1', tokenId: 't3', sceneId: 'cave', effects: [] });
  });

  it('rejects a missing item id, an unknown item and an item the actor does not own', async () => {
    const handler = createGetItemEffectsHandler(world().deps);

    await expect(handler({} as unknown as Parameters<typeof handler>[0])).rejects.toThrow(/itemId/);
    await expect(handler({ itemId: 'zz' })).rejects.toThrow('Item not found: zz');
    await expect(handler({ itemId: 'ring', actorId: 'a1' })).rejects.toThrow('Item not found: ring');
    await expect(handler({ itemId: 'sword', actorId: 'zz' })).rejects.toThrow('Actor not found: zz');
  });

  it('answers a token target without an active scene with the canonical text', async () => {
    const handler = createGetItemEffectsHandler(world(14, false).deps);

    await expect(handler({ itemId: 'club', tokenId: 't3' })).rejects.toThrow('No active scene; specify sceneId');
  });
});

describe('create-item-effect', () => {
  it('creates the effect in the Foundry 14 shape and answers with it in full', async () => {
    const { deps, hero } = world();
    const sword = (hero['items'] as { get(id: string): Record<string, unknown> }).get('sword');

    const result = await createCreateItemEffectHandler(deps)({
      itemId: 'sword',
      actorId: 'a1',
      name: 'Fire Shield',
      tint: '#f80',
      changes: [{ key: 'system.traits.dr.value', type: 'add', value: 'fire' }],
      duration: { value: 10, units: 'minutes' },
      showIcon: 'always'
    });

    expect(sword['createEmbeddedDocuments']).toHaveBeenCalledWith('ActiveEffect', [
      {
        name: 'Fire Shield',
        tint: '#ff8800',
        system: { changes: [{ key: 'system.traits.dr.value', type: 'add', value: 'fire' }] },
        duration: { value: 10, units: 'minutes', expiry: 'turnStart', expired: false },
        showIcon: 2
      }
    ]);
    expect(result).toMatchObject({
      id: 'new',
      name: 'Fire Shield',
      tint: '#ff8800',
      duration: { value: 10, units: 'minutes', expiry: 'turnStart', expired: false },
      showIcon: 'always',
      itemId: 'sword',
      actorId: 'a1',
      tokenId: null,
      sceneId: null
    });
  });

  it('creates the effect in the Foundry 13 shape', async () => {
    const { deps, ring } = world(13);

    await createCreateItemEffectHandler(deps)({
      itemId: 'ring',
      name: 'Ward',
      changes: [{ key: 'system.bonus', type: 'override', value: 3 }],
      duration: { value: 2, units: 'rounds' }
    });

    expect(ring['createEmbeddedDocuments']).toHaveBeenCalledWith('ActiveEffect', [
      {
        name: 'Ward',
        changes: [{ key: 'system.bonus', value: '3', mode: 5 }],
        duration: { seconds: null, rounds: 2, turns: null }
      }
    ]);
  });

  it('refuses what the running core does not store or register', async () => {
    const v13 = createCreateItemEffectHandler(world(13).deps);
    const v14 = createCreateItemEffectHandler(world(14).deps);

    await expect(v13({ itemId: 'ring', name: 'x', duration: { value: 8, units: 'hours' } })).rejects.toThrow(
      'Effect durations in hours require Foundry 14 or newer'
    );
    await expect(v13({ itemId: 'ring', name: 'x', showIcon: 'never' })).rejects.toThrow(
      'Effect icon visibility requires Foundry 14 or newer'
    );
    await expect(v14({ itemId: 'ring', name: 'x', type: 'curse' })).rejects.toThrow(
      'Unknown effect type: curse (valid: base, enchantment)'
    );
    await expect(v14({ itemId: 'ring', name: 'x', origin: 'Bob' })).rejects.toThrow(
      'Invalid effect origin: Bob (must reference a valid document type)'
    );
    await expect(
      v14({ itemId: 'ring', name: 'x', duration: { value: 1, units: 'rounds', expiry: 'dawn' } })
    ).rejects.toThrow(/^Unknown effect expiry event: dawn/);
  });

  it('rejects out-of-range values', async () => {
    const handler = createCreateItemEffectHandler(world().deps);

    await expect(handler({ itemId: 'ring', name: 'x', sort: 1.5 })).rejects.toThrow(/sort/);
    await expect(handler({ itemId: 'ring', name: 'x', tint: 'red' })).rejects.toThrow(/tint/);
  });
});

describe('update-item-effect', () => {
  it('updates the effect and answers with it as it stands', async () => {
    const { deps, aura } = world();

    const result = await createUpdateItemEffectHandler(deps)({
      itemId: 'ring',
      effectId: 'aura',
      name: 'Greater Protection',
      transfer: false,
      duration: { value: 3, units: 'turns', expiry: 'turnEnd' }
    });

    expect(aura.update).toHaveBeenCalledWith({
      name: 'Greater Protection',
      transfer: false,
      duration: { value: 3, units: 'turns', expiry: 'turnEnd', expired: false }
    });
    expect(result).toMatchObject({ id: 'aura', name: 'Greater Protection', transfer: false, itemId: 'ring', actorId: null });
  });

  it('makes an effect permanent', async () => {
    const { deps, aura } = world();

    await createUpdateItemEffectHandler(deps)({ itemId: 'ring', effectId: 'aura', duration: null });

    expect(aura.update).toHaveBeenCalledWith({ duration: { value: null, units: 'seconds', expiry: null, expired: false } });
  });

  it('rejects an unknown effect', async () => {
    await expect(createUpdateItemEffectHandler(world().deps)({ itemId: 'ring', effectId: 'zz', name: 'x' })).rejects.toThrow(
      'Effect not found: zz'
    );
  });
});

describe('delete-item-effect', () => {
  it('deletes the effect and says where', async () => {
    const { deps, aura } = world();

    const result = await createDeleteItemEffectHandler(deps)({ itemId: 'ring', effectId: 'aura' });

    expect(aura.delete).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true, effectId: 'aura', itemId: 'ring', actorId: null, tokenId: null, sceneId: null });
  });

  it('rejects an unknown effect or item', async () => {
    const handler = createDeleteItemEffectHandler(world().deps);

    await expect(handler({ itemId: 'ring', effectId: 'zz' })).rejects.toThrow('Effect not found: zz');
    await expect(handler({ itemId: 'zz', effectId: 'aura' })).rejects.toThrow('Item not found: zz');
  });
});

describe('get-actor-effect', () => {
  it('returns one effect of an actor in full', async () => {
    const result = await createGetActorEffectHandler(world().deps)({ actorId: 'a1', effectId: 'bless' });

    expect(result).toEqual({ ...AURA_WIRE, id: 'bless', name: 'Bless', transfer: false, actorId: 'a1', tokenId: null, sceneId: null });
  });

  it('rejects a missing target, an unknown effect, and rejects with an Error object', async () => {
    const handler = createGetActorEffectHandler(world().deps);

    await expect(handler({ effectId: 'bless' })).rejects.toThrow('Either actorId or tokenId is required');
    await expect(handler({ actorId: 'a1', effectId: 'zz' })).rejects.toBeInstanceOf(Error);
    await expect(handler({ actorId: 'a1', effectId: 'zz' })).rejects.toThrow('Effect not found: zz');
  });
});

describe('actor-effect commands, added attributes', () => {
  it('add-actor-effect sends a subtype, description, sort and icon visibility', async () => {
    const { deps, hero } = world();

    await createAddActorEffectHandler(deps)({
      actorId: 'a1',
      name: 'Haste',
      type: 'enchantment',
      description: '<p>Fast.</p>',
      sort: 5,
      showIcon: 'never'
    });

    expect(hero['createEmbeddedDocuments']).toHaveBeenCalledWith('ActiveEffect', [
      { name: 'Haste', type: 'enchantment', description: '<p>Fast.</p>', sort: 5, showIcon: 0 }
    ]);
  });

  it('add-actor-effect refuses an icon visibility on Foundry 13', async () => {
    await expect(createAddActorEffectHandler(world(13).deps)({ actorId: 'a1', name: 'x', showIcon: 'never' })).rejects.toThrow(
      'Effect icon visibility requires Foundry 14 or newer'
    );
  });

  it('add-actor-effect keeps every duration in several units, dropping on Foundry 14 a zero that would mask the length', async () => {
    const v14 = world(14);
    const v13 = world(13);
    const add14 = createAddActorEffectHandler(v14.deps);

    await add14({ actorId: 'a1', name: 'a', duration: { rounds: 10, turns: 0 } });
    await add14({ actorId: 'a1', name: 'b', duration: { seconds: 60, rounds: 10 } });
    await add14({ actorId: 'a1', name: 'c', duration: { turns: 0 } });
    await createAddActorEffectHandler(v13.deps)({ actorId: 'a1', name: 'd', duration: { rounds: 10, turns: 0 } });

    const sent = (hero: Record<string, unknown>): unknown[] =>
      (hero['createEmbeddedDocuments'] as jest.Mock).mock.calls.map((call: unknown[]) => (call[1] as { duration: unknown }[])[0]?.duration);
    expect(sent(v14.hero)).toEqual([{ rounds: 10 }, { seconds: 60, rounds: 10 }, { turns: 0 }]);
    expect(sent(v13.hero)).toEqual([{ rounds: 10, turns: 0 }]);
  });

  it('update-actor-effect sends tint, origin and statuses, and checks the origin', async () => {
    const { deps, hero } = world();
    const bless = (hero['effects'] as { get(id: string): StoredEffect }).get('bless');
    const handler = createUpdateActorEffectHandler(deps);

    await handler({ actorId: 'a1', effectId: 'bless', tint: '#0f0', origin: 'Item.abcdefghijklmnop', statuses: ['blessed'] });

    expect(bless.update).toHaveBeenCalledWith({ tint: '#00ff00', origin: 'Item.abcdefghijklmnop', statuses: ['blessed'] });
    await expect(handler({ actorId: 'a1', effectId: 'bless', origin: 'Bob' })).rejects.toThrow('Invalid effect origin: Bob');
  });
});
