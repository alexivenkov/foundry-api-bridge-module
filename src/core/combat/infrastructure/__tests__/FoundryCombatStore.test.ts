import { CombatNotFoundError } from '../../domain';
import { FoundryCombatStore } from '../FoundryCombatStore';
import type { FoundryCombatDocument, FoundryCombatGame } from '../foundryCombatTypes';
import {
  clearFoundryGeneration,
  combatDocument,
  combatantDocument,
  gameWith,
  setFoundryGeneration,
  tokenOn,
  type GameOptions
} from './fakeDocuments';

function storeFor(combats: FoundryCombatDocument[], options: GameOptions = {}): {
  store: FoundryCombatStore;
  get: jest.Mock;
} {
  const { game, get } = gameWith(combats, options);
  return { store: new FoundryCombatStore({ getGame: () => game }), get };
}

function storeCreating(created: FoundryCombatDocument | null | undefined): {
  store: FoundryCombatStore;
  create: jest.Mock;
} {
  const create = jest.fn().mockResolvedValue(created);
  const { game } = gameWith([]);
  return { store: new FoundryCombatStore({ getGame: () => game }, () => ({ create })), create };
}

describe('FoundryCombatStore', () => {
  afterEach(clearFoundryGeneration);

  describe('locating a combat', () => {
    it('finds a combat of the world by id', () => {
      const { store, get } = storeFor([combatDocument({ id: 'fight' }).document]);

      expect(store.findCombat('fight')).toEqual({ id: 'fight' });
      expect(get).toHaveBeenCalledWith('fight');
    });

    it('returns null for an unknown id', () => {
      expect(storeFor([]).store.findCombat('missing')).toBeNull();
    });

    it('answers for the combat the tracker shows without a collection lookup', () => {
      const viewed = combatDocument({ id: 'fight' }).document;
      const { store, get } = storeFor([], { viewed });

      expect(store.findCombat('fight')).toEqual({ id: 'fight' });
      expect(store.findActiveCombat()).toEqual({ id: 'fight' });
      expect(get).not.toHaveBeenCalled();
    });

    it('looks another combat up in the collection even while one is shown', () => {
      const viewed = combatDocument({ id: 'fight' }).document;
      const other = combatDocument({ id: 'ambush' }).document;

      expect(storeFor([viewed, other], { viewed }).store.findCombat('ambush')).toEqual({ id: 'ambush' });
    });

    it.each([[null], [undefined]])('has no active combat when the tracker shows %s', (viewed) => {
      const { store } = storeFor([combatDocument().document], { viewed });

      expect(store.findActiveCombat()).toBeNull();
    });

    it('reads the game on every call', () => {
      let game: FoundryCombatGame = gameWith([]).game;
      const store = new FoundryCombatStore({ getGame: () => game });

      expect(store.findActiveCombat()).toBeNull();
      game = gameWith([], { viewed: combatDocument({ id: 'late' }).document }).game;
      expect(store.findActiveCombat()).toEqual({ id: 'late' });
    });
  });

  describe('the active scene', () => {
    it('gives the id of the active scene', () => {
      expect(storeFor([], { activeScene: { id: 'tavern' } }).store.findActiveSceneId()).toBe('tavern');
    });

    it.each([[null], [undefined]])('gives null when the active scene is %s', (activeScene) => {
      expect(storeFor([], { activeScene }).store.findActiveSceneId()).toBeNull();
    });
  });

  describe('readCombat', () => {
    it('reports the turn order from `turns`, not from the combatants collection', () => {
      const wizard = combatantDocument({ id: 'wizard', initiative: 18 });
      const goblin = combatantDocument({ id: 'goblin', initiative: 12 });
      const { document } = combatDocument(
        { id: 'fight', round: 2, turn: 1, started: true, combatant: goblin, turns: [wizard, goblin] },
        [goblin, wizard]
      );

      const combat = storeFor([document]).store.readCombat('fight');

      expect(combat).toMatchObject({ id: 'fight', round: 2, turn: 1, started: true });
      expect(combat.turnOrder.map((entry) => entry.id)).toEqual(['wizard', 'goblin']);
      expect(combat.current?.id).toBe('goblin');
    });

    it('copies the combatant fields as they are', () => {
      const fighter = combatantDocument({
        id: 'c1',
        actorId: 'a1',
        tokenId: null,
        name: 'Fighter',
        img: 'icons/fighter.webp',
        initiative: null,
        defeated: true,
        hidden: true
      });
      const { document } = combatDocument({ combatant: fighter }, [fighter]);

      expect(storeFor([document]).store.readCombat('fight').current).toEqual({
        id: 'c1',
        actorId: 'a1',
        tokenId: null,
        name: 'Fighter',
        img: 'icons/fighter.webp',
        initiative: null,
        defeated: true,
        hidden: true
      });
    });

    it.each([[null], [undefined]])('has no current combatant when the core gives %s', (combatant) => {
      const { document } = combatDocument({ combatant }, [combatantDocument()]);

      expect(storeFor([document]).store.readCombat('fight').current).toBeNull();
    });

    it('rejects an unknown combat', () => {
      const { store } = storeFor([]);

      expect(() => store.readCombat('missing')).toThrow(CombatNotFoundError);
      expect(() => store.readCombat('missing')).toThrow('Combat not found: missing');
    });
  });

  describe('readTurn', () => {
    it('reports whose turn it is and every combatant of the collection', () => {
      const wizard = combatantDocument({ id: 'wizard' });
      const goblin = combatantDocument({ id: 'goblin' });
      const { document } = combatDocument({ round: 3, turn: 0, combatant: wizard, turns: [wizard] }, [goblin, wizard]);

      const turn = storeFor([document]).store.readTurn('fight');

      expect(turn).toMatchObject({ round: 3, turn: 0 });
      expect(turn.current?.id).toBe('wizard');
      expect(turn.combatants.map((entry) => entry.id)).toEqual(['goblin', 'wizard']);
    });

    it('does not need the turn order', () => {
      const { document } = combatDocument({ combatant: null });
      const bare = { ...document, turns: undefined } as unknown as FoundryCombatDocument;

      expect(storeFor([bare]).store.readTurn('fight')).toEqual({
        round: 0,
        turn: 0,
        current: null,
        currentSceneId: null,
        combatants: []
      });
    });

    describe('the scene of the current token', () => {
      function turnOf(current: ReturnType<typeof combatantDocument> | null) {
        const { document } = combatDocument({ combatant: current }, current ? [current] : []);
        return storeFor([document]).store.readTurn('fight');
      }

      it.each([13, 14])('is the scene the core finds the token on (Foundry %i)', (generation) => {
        setFoundryGeneration(generation);

        expect(turnOf(combatantDocument({ token: tokenOn('crypt') })).currentSceneId).toBe('crypt');
      });

      it('is unknown when the core finds the token on no scene', () => {
        setFoundryGeneration(13);

        expect(turnOf(combatantDocument({ token: null })).currentSceneId).toBeNull();
      });

      it('is unknown for a token that has no scene', () => {
        setFoundryGeneration(13);

        expect(turnOf(combatantDocument({ token: { parent: null } })).currentSceneId).toBeNull();
      });

      it('is unknown when it is no one\'s turn', () => {
        setFoundryGeneration(14);

        expect(turnOf(null).currentSceneId).toBeNull();
      });

      it.each([
        ['Foundry 12', 12],
        ['Foundry 11', 11],
        ['an unknown version', 0]
      ])('is not asked of %s, where it is not verified', (_case, generation) => {
        if (generation > 0) {
          setFoundryGeneration(generation);
        }

        expect(turnOf(combatantDocument({ token: tokenOn('crypt') })).currentSceneId).toBeNull();
      });
    });
  });

  describe('createCombat', () => {
    it('links the scene at creation', async () => {
      const { store, create } = storeCreating(combatDocument({ id: 'new' }).document);

      const created = await store.createCombat({ sceneId: 'dungeon', activate: false });

      expect(create).toHaveBeenCalledWith({ scene: 'dungeon' });
      expect(created).toMatchObject({ id: 'new', round: 0, started: false, turnOrder: [], current: null });
    });

    it('sends no scene at all when the draft has none', async () => {
      const { store, create } = storeCreating(combatDocument().document);

      await store.createCombat({ activate: false });
      await store.createCombat({ sceneId: undefined, activate: false });

      expect(create.mock.calls).toEqual([[{}], [{}]]);
      expect(Object.keys((create.mock.calls[1] as [Record<string, unknown>])[0])).toEqual([]);
    });

    it.each([[null], ['']])('sends a scene of %j as it is', async (sceneId) => {
      const { store, create } = storeCreating(combatDocument().document);

      await store.createCombat({ sceneId, activate: false });

      expect(create).toHaveBeenCalledWith({ scene: sceneId });
    });

    it('activates the created document when the draft asks for it', async () => {
      const { document, activate } = combatDocument({ id: 'new' });
      const { store } = storeCreating(document);

      await store.createCombat({ sceneId: 'dungeon', activate: true });

      expect(activate).toHaveBeenCalledTimes(1);
      expect(activate).toHaveBeenCalledWith();
    });

    it('leaves it inactive otherwise', async () => {
      const { document, activate } = combatDocument({ id: 'new' });
      const { store } = storeCreating(document);

      await store.createCombat({ sceneId: 'dungeon', activate: false });

      expect(activate).not.toHaveBeenCalled();
    });

    it.each([[null], [undefined]])('resolves to null when the core created %s', async (created) => {
      const { store } = storeCreating(created);

      await expect(store.createCombat({ activate: true })).resolves.toBeNull();
    });

    it('reads the Combat class only when a combat is created', async () => {
      const combatClass = jest.fn().mockReturnValue({ create: jest.fn().mockResolvedValue(combatDocument().document) });
      const { game } = gameWith([]);
      const store = new FoundryCombatStore({ getGame: () => game }, combatClass);

      expect(combatClass).not.toHaveBeenCalled();
      await store.createCombat({ activate: false });
      expect(combatClass).toHaveBeenCalledTimes(1);
    });
  });

  describe('turns', () => {
    const TURN_CALLS = ['startCombat', 'nextTurn', 'previousTurn'] as const;

    it.each(TURN_CALLS)('%s reports the combat as the core call leaves it', async (method) => {
      const mocks = combatDocument({ id: 'fight', round: 0, turn: 0 });
      // Foundry 13 and 14 update the document in place and resolve to it.
      mocks[method].mockImplementation(() => {
        Object.assign(mocks.document, { round: 1, turn: 2, started: true });
        return Promise.resolve(mocks.document);
      });

      const state = await storeFor([mocks.document]).store[method]('fight');

      expect(mocks[method]).toHaveBeenCalledWith();
      expect(state).toMatchObject({ id: 'fight', round: 1, turn: 2, started: true });
    });

    it.each(TURN_CALLS)('%s reports the combat itself when the core call resolves to nothing', async (method) => {
      const wizard = combatantDocument({ id: 'wizard' });
      const mocks = combatDocument({ id: 'fight', round: 2, turn: 0, started: true, combatant: wizard }, [wizard]);
      mocks[method].mockResolvedValue(undefined);

      const state = await storeFor([mocks.document]).store[method]('fight');

      expect(mocks[method]).toHaveBeenCalledTimes(1);
      expect(state).toMatchObject({ id: 'fight', round: 2, turn: 0, started: true, current: { id: 'wizard' } });
      expect(state.turnOrder.map((entry) => entry.id)).toEqual(['wizard']);
    });

    it('sets the turn alone and reports the document as it is afterwards', async () => {
      const wizard = combatantDocument({ id: 'wizard' });
      const goblin = combatantDocument({ id: 'goblin' });
      const { document, update } = combatDocument({ round: 2, turn: 0, started: true }, [wizard, goblin]);

      const state = await storeFor([document]).store.setTurn('fight', 1);

      expect(update).toHaveBeenCalledWith({ turn: 1 });
      expect(state).toMatchObject({ round: 2, turn: 1 });
    });

    it('rejects an unknown combat', async () => {
      await expect(storeFor([]).store.nextTurn('missing')).rejects.toThrow(CombatNotFoundError);
      await expect(storeFor([]).store.setTurn('missing', 0)).rejects.toThrow(CombatNotFoundError);
    });
  });

  describe('deleteCombat', () => {
    it('deletes the document', async () => {
      const { document, remove } = combatDocument();

      await storeFor([document]).store.deleteCombat('fight');

      expect(remove).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown combat', async () => {
      await expect(storeFor([]).store.deleteCombat('missing')).rejects.toThrow('Combat not found: missing');
    });
  });
});
