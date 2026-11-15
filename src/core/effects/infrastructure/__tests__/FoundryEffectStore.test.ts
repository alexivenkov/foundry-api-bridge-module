import { ActorNotFoundError, TokenHasNoActorError, type ActorRef } from '../../../shared';
import { FoundryEffectStore } from '../FoundryEffectStore';
import type { FoundryActiveEffect, FoundryEffectActor, FoundryEffectGame } from '../foundryEffectTypes';

function effectDocument(overrides: Partial<FoundryActiveEffect> = {}): FoundryActiveEffect {
  const doc: FoundryActiveEffect = {
    _id: 'e1',
    name: 'Bless',
    img: 'bless.webp',
    disabled: false,
    origin: null,
    statuses: new Set<string>(),
    changes: [],
    duration: {},
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryActiveEffect>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

interface ActorMocks {
  actor: FoundryEffectActor;
  toggle: jest.Mock;
  create: jest.Mock;
}

function actor(id: string, name: string, effects: FoundryActiveEffect[] = [], statuses: string[] = []): ActorMocks {
  const toggle = jest.fn();
  const create = jest.fn();
  return {
    actor: {
      id,
      name,
      effects: { contents: effects, get: (effectId) => effects.find((candidate) => candidate._id === effectId) },
      statuses: new Set(statuses),
      toggleStatusEffect: toggle,
      createEmbeddedDocuments: create
    },
    toggle,
    create
  };
}

const HERO: ActorRef = { kind: 'world', actorId: 'a1' };
const GOBLIN_THREE: ActorRef = { kind: 'token', sceneId: 'cave', tokenId: 't3' };

function storeFor(hero: FoundryEffectActor | undefined, goblinThree: FoundryEffectActor | null = null): FoundryEffectStore {
  const cave = {
    id: 'cave',
    tokens: { get: (id: string) => (id === 't3' ? { id: 't3', actor: goblinThree } : undefined) }
  };
  const game: FoundryEffectGame = {
    actors: { get: (id) => (id === 'a1' ? hero : undefined) },
    scenes: { get: (id) => (id === 'cave' ? cave : undefined), active: null }
  };
  return new FoundryEffectStore({ getGame: () => game });
}

describe('FoundryEffectStore', () => {
  describe('reading', () => {
    it('reads the effects and active statuses of a world actor', () => {
      const bless = effectDocument({ duration: { rounds: 10 } });
      const { actor: hero } = actor('a1', 'Hero', [bless, effectDocument({ _id: 'e2', disabled: true })], ['blessed']);

      const { effects, activeStatuses } = storeFor(hero).readEffects(HERO);

      expect(effects.map((e) => [e.id, e.disabled])).toEqual([['e1', false], ['e2', true]]);
      expect(effects[0]?.duration).toEqual({ rounds: 10 });
      expect(activeStatuses).toEqual(['blessed']);
    });

    it("reads a token's own effects, not those of the world actor", () => {
      const { actor: hero } = actor('a1', 'Hero', [effectDocument()]);
      const { actor: goblin } = actor('g1', 'Goblin 3', [effectDocument({ _id: 'prone', name: 'Prone' })], ['prone']);

      const { effects, activeStatuses } = storeFor(hero, goblin).readEffects(GOBLIN_THREE);

      expect(effects.map((e) => e.id)).toEqual(['prone']);
      expect(activeStatuses).toEqual(['prone']);
    });

    it('tells whether the actor has an effect', () => {
      const store = storeFor(actor('a1', 'Hero', [effectDocument()]).actor);

      expect(store.hasEffect(HERO, 'e1')).toBe(true);
      expect(store.hasEffect(HERO, 'zz')).toBe(false);
    });

    it('fails with the lookup error of the reference when the actor is gone', () => {
      expect(() => storeFor(undefined).readEffects(HERO)).toThrow(ActorNotFoundError);
      expect(() => storeFor(undefined, null).hasEffect(GOBLIN_THREE, 'e1')).toThrow(TokenHasNoActorError);
    });
  });

  describe('toggleStatus', () => {
    it('toggles without an options object when no option is set', async () => {
      const { actor: hero, toggle } = actor('a1', 'Hero');
      toggle.mockResolvedValue(true);

      const outcome = await storeFor(hero).toggleStatus(HERO, 'prone', {});

      expect(toggle).toHaveBeenCalledWith('prone', undefined);
      expect(outcome).toEqual({ active: true, effectId: null });
    });

    it('passes the options that are set and reports the effect the core created', async () => {
      const { actor: goblin, toggle } = actor('g1', 'Goblin 3');
      toggle.mockResolvedValue({ _id: 'new-effect', name: 'Dead' });

      const outcome = await storeFor(undefined, goblin).toggleStatus(GOBLIN_THREE, 'dead', { active: true, overlay: true });

      expect(toggle).toHaveBeenCalledWith('dead', { active: true, overlay: true });
      expect(outcome).toEqual({ active: true, effectId: 'new-effect' });
    });

    it('reports a removed status as inactive', async () => {
      const { actor: hero, toggle } = actor('a1', 'Hero');
      toggle.mockResolvedValue(false);

      await expect(storeFor(hero).toggleStatus(HERO, 'prone', { active: false })).resolves.toEqual({
        active: false,
        effectId: null
      });
    });
  });

  describe('createEffect', () => {
    it('creates an embedded ActiveEffect from the attributes that are set', async () => {
      const { actor: hero, create } = actor('a1', 'Hero');
      create.mockResolvedValue([{ _id: 'new', name: 'Haste' }]);
      const draft = { name: 'Haste', changes: [{ key: 'system.attributes.ac.bonus', value: '2', mode: 2 }], duration: { rounds: 10 } };

      const created = await storeFor(hero).createEffect(HERO, draft);

      expect(create).toHaveBeenCalledWith('ActiveEffect', [draft]);
      expect(created).toEqual({ id: 'new', name: 'Haste' });
    });

    it.each([
      ['an empty list', []],
      ['null', null]
    ])('resolves to null when the core hands back %s', async (_case, result) => {
      const { actor: hero, create } = actor('a1', 'Hero');
      create.mockResolvedValue(result);

      await expect(storeFor(hero).createEffect(HERO, { name: 'Haste' })).resolves.toBeNull();
    });
  });

  describe('updateEffect', () => {
    it('updates the effect and reads its name back', async () => {
      const bless = effectDocument();
      const store = storeFor(actor('a1', 'Hero', [bless]).actor);

      const updated = await store.updateEffect(HERO, 'e1', { name: 'Greater Bless', disabled: true });

      expect(bless.update).toHaveBeenCalledWith({ name: 'Greater Bless', disabled: true });
      expect(updated).toEqual({ id: 'e1', name: 'Greater Bless' });
    });

    it('resolves to null for an effect the actor does not have', async () => {
      await expect(storeFor(actor('a1', 'Hero').actor).updateEffect(HERO, 'zz', { name: 'x' })).resolves.toBeNull();
    });
  });

  describe('deleteEffect', () => {
    it('deletes the effect document', async () => {
      const bless = effectDocument();

      await storeFor(actor('a1', 'Hero', [bless]).actor).deleteEffect(HERO, 'e1');

      expect(bless.delete).toHaveBeenCalledTimes(1);
    });

    it('does nothing for an effect that is already gone', async () => {
      await expect(storeFor(actor('a1', 'Hero').actor).deleteEffect(HERO, 'zz')).resolves.toBeUndefined();
    });
  });
});
