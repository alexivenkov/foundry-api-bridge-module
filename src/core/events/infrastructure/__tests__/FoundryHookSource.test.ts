import type { GameEventName, GameEventOccurrence } from '../../domain';
import { FoundryHookSource } from '../FoundryHookSource';
import { HOOK_BINDINGS } from '../hookBindings';
import { FakeHooks, globalsWith } from './fakeHooks';

// Fakes follow the Foundry 13 / 14 client sources: update hooks get the diff
// `updateSource` returned plus `_id` (client-backend.mjs), documents carry
// `pack` (null in the world) and a `parent`.

function setup(events: readonly GameEventName[]): { hooks: FakeHooks; source: FoundryHookSource; seen: GameEventOccurrence[] } {
  const hooks = new FakeHooks();
  const source = new FoundryHookSource(globalsWith(hooks));
  const seen: GameEventOccurrence[] = [];
  source.watch(new Set(events), (event) => seen.push(event));
  return { hooks, source, seen };
}

const scene = { id: 's1', name: 'Keep', documentName: 'Scene', pack: null };
const token = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 't1',
  name: 'Goblin',
  actorId: 'a1',
  x: 100,
  y: 200,
  elevation: 5,
  hidden: false,
  documentName: 'Token',
  pack: null,
  parent: scene,
  _source: {},
  ...extra
});

describe('FoundryHookSource', () => {
  describe('listener lifecycle', () => {
    it('touches no Foundry global before something is watched', () => {
      const source = new FoundryHookSource(() => {
        throw new Error('Hooks read too early');
      });

      expect(() => {
        source.watch(new Set(), () => undefined);
      }).not.toThrow();
      expect(source.activeHooks()).toEqual([]);
    });

    it('registers only the hooks the watched events need, and removes them when unwatched', () => {
      const { hooks, source } = setup(['token-moved']);
      expect(hooks.registeredHooks()).toEqual(['updateToken']);

      source.watch(new Set(['token-moved', 'combat-started', 'scene-activated']), () => undefined);
      expect(hooks.registeredHooks()).toEqual(['updateCombat', 'updateScene', 'updateToken']);

      source.watch(new Set(['combat-started']), () => undefined);
      expect(hooks.registeredHooks()).toEqual(['updateCombat']);

      source.watch(new Set(), () => undefined);
      expect(hooks.registeredHooks()).toEqual([]);
    });

    it('keeps the registered listener when the watched set changes within the same hook', () => {
      const { hooks, source } = setup(['token-moved']);
      const spy = jest.spyOn(hooks, 'on');

      source.watch(new Set(['token-moved', 'token-updated']), () => undefined);

      expect(spy).not.toHaveBeenCalled();
    });

    it('watches every event with one listener per hook', () => {
      const all = HOOK_BINDINGS.flatMap((binding) => binding.events);
      const { hooks } = setup(all);

      expect(new Set(HOOK_BINDINGS.map((binding) => binding.hook)).size).toBe(HOOK_BINDINGS.length);
      expect(hooks.registeredHooks()).toHaveLength(HOOK_BINDINGS.length);
      expect(new Set(all).size).toBe(29);
    });

    it('swallows a failing listener and lets the rest of a Hooks.call chain run', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation();
      const { hooks } = setup(['scene-viewed']);
      const later = jest.fn();
      hooks.on('canvasReady', later);
      const canvas = {
        get scene(): never {
          throw new Error('broken canvas');
        }
      };

      expect(hooks.call('canvasReady', canvas)).toBe(true);
      expect(later).toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith("Foundry API Bridge | Event listener for hook 'canvasReady' failed:", expect.any(Error));
      warn.mockRestore();
    });
  });

  describe('tokens', () => {
    it('reports a move with the new position and no update for internal keys', () => {
      const { hooks, seen } = setup(['token-moved', 'token-updated']);

      hooks.callAll('updateToken', token(), { _id: 't1', x: 100, y: 200, _movementHistory: [] }, {}, 'u1');

      expect(seen).toEqual([
        {
          name: 'token-moved',
          data: { tokenId: 't1', sceneId: 's1', name: 'Goblin', actorId: 'a1', x: 100, y: 200, elevation: 5, userId: 'u1' }
        }
      ]);
    });

    it('adds the scene level on Foundry 14', () => {
      const { hooks, seen } = setup(['token-moved']);

      hooks.callAll('updateToken', token({ _source: { level: 'defaultLevel0000' } }), { _id: 't1', elevation: 5 }, {}, 'u1');

      expect(seen[0]?.data).toMatchObject({ level: 'defaultLevel0000' });
    });

    it('splits a move and other changes into token-moved and token-updated', () => {
      const { hooks, seen } = setup(['token-moved', 'token-updated']);

      hooks.callAll('updateToken', token(), { _id: 't1', x: 100, rotation: 90, hidden: true }, {}, 'u1');

      expect(seen.map((event) => event.name)).toEqual(['token-moved', 'token-updated']);
      expect(seen[1]?.data).toMatchObject({ changedKeys: ['hidden', 'rotation'] });
    });

    it('produces only the watched events of a hook', () => {
      const { hooks, seen } = setup(['token-updated']);

      hooks.callAll('updateToken', token(), { _id: 't1', x: 1 }, {}, 'u1');
      hooks.callAll('updateToken', token(), { _id: 't1', x: 2, name: 'Orc' }, {}, 'u1');

      expect(seen.map((event) => event.name)).toEqual(['token-updated']);
    });

    it('reports creation and deletion', () => {
      const { hooks, seen } = setup(['token-created', 'token-deleted']);

      hooks.callAll('createToken', token({ hidden: true }), {}, 'u1');
      hooks.callAll('deleteToken', token(), {}, 'u1');

      expect(seen).toEqual([
        {
          name: 'token-created',
          data: { tokenId: 't1', sceneId: 's1', name: 'Goblin', actorId: 'a1', x: 100, y: 200, elevation: 5, hidden: true, userId: 'u1' }
        },
        { name: 'token-deleted', data: { tokenId: 't1', sceneId: 's1', name: 'Goblin', actorId: 'a1', userId: 'u1' } }
      ]);
    });
  });

  describe('combat', () => {
    const combatant = { id: 'cb2', name: 'Goblin', actorId: 'a1', tokenId: 't1' };
    const combat = (extra: Record<string, unknown>): Record<string, unknown> => ({
      id: 'c1',
      pack: null,
      round: 1,
      turn: 1,
      combatant,
      _source: { scene: 's1' },
      ...extra
    });
    const events: GameEventName[] = ['combat-started', 'combat-round-changed', 'combat-turn-changed', 'combat-ended'];

    it('reports the start when the round leaves 0', () => {
      const { hooks, seen } = setup(events);

      hooks.callAll('updateCombat', combat({ turn: 0, previous: { round: 0, turn: null, combatantId: null } }), { _id: 'c1', round: 1, turn: 0 }, {}, 'gm');

      expect(seen).toEqual([
        {
          name: 'combat-started',
          data: {
            combatId: 'c1',
            sceneId: 's1',
            round: 1,
            turn: 0,
            combatant: { combatantId: 'cb2', name: 'Goblin', actorId: 'a1', tokenId: 't1' },
            userId: 'gm'
          }
        }
      ]);
    });

    it('reports a turn change with the previous turn and combatant', () => {
      const { hooks, seen } = setup(events);

      hooks.callAll('updateCombat', combat({ previous: { round: 1, turn: 0, combatantId: 'cb1' } }), { _id: 'c1', turn: 1 }, {}, 'u2');

      expect(seen[0]).toMatchObject({
        name: 'combat-turn-changed',
        data: { round: 1, turn: 1, previousTurn: 0, previousCombatantId: 'cb1', userId: 'u2' }
      });
    });

    it('reports a round change with the previous round', () => {
      const { hooks, seen } = setup(events);

      hooks.callAll('updateCombat', combat({ round: 2, turn: 0, previous: { round: 1, turn: 3, combatantId: 'cb4' } }), { _id: 'c1', round: 2, turn: 0 }, {}, 'gm');

      expect(seen[0]).toMatchObject({ name: 'combat-round-changed', data: { round: 2, turn: 0, previousRound: 1 } });
    });

    it('ignores an update that changes neither round nor turn', () => {
      const { hooks, seen } = setup(events);

      hooks.callAll('updateCombat', combat({}), { _id: 'c1', active: true }, {}, 'gm');

      expect(seen).toEqual([]);
    });

    it('reports the end when the encounter is deleted', () => {
      const { hooks, seen } = setup(events);

      hooks.callAll('deleteCombat', combat({ round: 3 }), {}, 'gm');

      expect(seen).toEqual([{ name: 'combat-ended', data: { combatId: 'c1', sceneId: 's1', round: 3, userId: 'gm' } }]);
    });
  });

  describe('documents', () => {
    it('reports actor changes as top-level keys, with the token of a synthetic actor', () => {
      const { hooks, seen } = setup(['actor-created', 'actor-updated', 'actor-deleted']);
      const actor = { id: 'a1', name: 'Hero', type: 'character', pack: null, isToken: false, token: null };
      const synthetic = { ...actor, isToken: true, token: { id: 't1', parent: scene } };

      hooks.callAll('createActor', actor, {}, 'gm');
      hooks.callAll('updateActor', actor, { _id: 'a1', system: { hp: 5 }, name: 'Hero 2', _stats: {} }, {}, 'gm');
      hooks.callAll('updateActor', synthetic, { system: { hp: 1 } }, {}, 'gm');
      hooks.callAll('updateActor', actor, { _id: 'a1', _stats: {} }, {}, 'gm');
      hooks.callAll('deleteActor', actor, {}, 'gm');

      expect(seen).toEqual([
        { name: 'actor-created', data: { actorId: 'a1', name: 'Hero', type: 'character', userId: 'gm' } },
        {
          name: 'actor-updated',
          data: { actorId: 'a1', name: 'Hero', type: 'character', tokenId: null, sceneId: null, changedKeys: ['name', 'system'], userId: 'gm' }
        },
        {
          name: 'actor-updated',
          data: { actorId: 'a1', name: 'Hero', type: 'character', tokenId: 't1', sceneId: 's1', changedKeys: ['system'], userId: 'gm' }
        },
        { name: 'actor-deleted', data: { actorId: 'a1', name: 'Hero', type: 'character', userId: 'gm' } }
      ]);
    });

    it('skips compendium documents', () => {
      const { hooks, seen } = setup(['actor-created', 'item-created']);

      hooks.callAll('createActor', { id: 'a1', name: 'Hero', type: 'npc', pack: 'world.monsters' }, {}, 'gm');
      hooks.callAll('createItem', { id: 'i1', name: 'Sword', type: 'weapon', pack: 'world.monsters' }, {}, 'gm');

      expect(seen).toEqual([]);
    });

    it('names the owner of an item: world, actor, or unlinked token through its ActorDelta', () => {
      const { hooks, seen } = setup(['item-created', 'item-updated', 'item-deleted']);
      const actor = { id: 'a1', documentName: 'Actor', isToken: false };
      const delta = { documentName: 'ActorDelta', parent: { id: 't1', actorId: 'a1', documentName: 'Token' } };

      hooks.callAll('createItem', { id: 'i1', name: 'Rope', type: 'loot', pack: null, parent: null }, {}, 'gm');
      hooks.callAll('updateItem', { id: 'i2', name: 'Sword', type: 'weapon', pack: null, parent: actor }, { name: 'Sword' }, {}, 'gm');
      hooks.callAll('deleteItem', { id: 'i3', name: 'Dagger', type: 'weapon', pack: null, parent: delta }, {}, 'gm');

      expect(seen.map((event) => event.data)).toEqual([
        { itemId: 'i1', name: 'Rope', type: 'loot', actorId: null, tokenId: null, userId: 'gm' },
        { itemId: 'i2', name: 'Sword', type: 'weapon', actorId: 'a1', tokenId: null, changedKeys: ['name'], userId: 'gm' },
        { itemId: 'i3', name: 'Dagger', type: 'weapon', actorId: 'a1', tokenId: 't1', userId: 'gm' }
      ]);
    });

    it('reports journal entries and their pages as journal-updated', () => {
      const { hooks, seen } = setup(['journal-created', 'journal-updated', 'journal-deleted']);
      const entry = { id: 'j1', name: 'Lore', pack: null };
      const page = { id: 'p1', name: 'Chapter 1', pack: null, parent: entry };

      hooks.callAll('createJournalEntry', entry, {}, 'gm');
      hooks.callAll('updateJournalEntry', entry, { _id: 'j1', name: 'Lore' }, {}, 'gm');
      hooks.callAll('createJournalEntryPage', page, {}, 'gm');
      hooks.callAll('updateJournalEntryPage', page, { _id: 'p1', text: { content: '<p>x</p>' } }, {}, 'u1');
      hooks.callAll('deleteJournalEntryPage', page, {}, 'gm');
      hooks.callAll('deleteJournalEntry', entry, {}, 'gm');

      expect(seen.map((event) => [event.name, event.data])).toEqual([
        ['journal-created', { journalId: 'j1', name: 'Lore', userId: 'gm' }],
        ['journal-updated', { journalId: 'j1', name: 'Lore', changedKeys: ['name'], page: null, userId: 'gm' }],
        [
          'journal-updated',
          {
            journalId: 'j1',
            name: 'Lore',
            changedKeys: ['pages'],
            page: { pageId: 'p1', name: 'Chapter 1', change: 'created', changedKeys: [] },
            userId: 'gm'
          }
        ],
        [
          'journal-updated',
          {
            journalId: 'j1',
            name: 'Lore',
            changedKeys: ['pages'],
            page: { pageId: 'p1', name: 'Chapter 1', change: 'updated', changedKeys: ['text'] },
            userId: 'u1'
          }
        ],
        [
          'journal-updated',
          {
            journalId: 'j1',
            name: 'Lore',
            changedKeys: ['pages'],
            page: { pageId: 'p1', name: 'Chapter 1', change: 'deleted', changedKeys: [] },
            userId: 'gm'
          }
        ],
        ['journal-deleted', { journalId: 'j1', name: 'Lore', userId: 'gm' }]
      ]);
    });

    it('reports a scene activation apart from its other changes', () => {
      const { hooks, seen } = setup(['scene-created', 'scene-updated', 'scene-activated', 'scene-deleted']);

      hooks.callAll('createScene', scene, {}, 'gm');
      hooks.callAll('updateScene', scene, { _id: 's1', active: true }, {}, 'gm');
      hooks.callAll('updateScene', scene, { _id: 's1', active: false }, {}, 'gm');
      hooks.callAll('updateScene', scene, { _id: 's1', active: true, darkness: 0.5 }, {}, 'gm');
      hooks.callAll('deleteScene', scene, {}, 'gm');

      expect(seen.map((event) => [event.name, event.data])).toEqual([
        ['scene-created', { sceneId: 's1', name: 'Keep', userId: 'gm' }],
        ['scene-activated', { sceneId: 's1', name: 'Keep', userId: 'gm' }],
        ['scene-activated', { sceneId: 's1', name: 'Keep', userId: 'gm' }],
        ['scene-updated', { sceneId: 's1', name: 'Keep', changedKeys: ['darkness'], userId: 'gm' }],
        ['scene-deleted', { sceneId: 's1', name: 'Keep', userId: 'gm' }]
      ]);
    });

    it('reports the viewed scene once per change of scene, never stopping the canvasReady chain', () => {
      const { hooks, seen } = setup(['scene-viewed']);
      const other = { id: 's2', name: 'Cave' };

      expect(hooks.call('canvasReady', { scene })).toBe(true);
      hooks.call('canvasReady', { scene });
      hooks.call('canvasReady', { scene: other });
      hooks.call('canvasReady', { scene: null });

      expect(seen).toEqual([
        { name: 'scene-viewed', data: { sceneId: 's1', name: 'Keep' } },
        { name: 'scene-viewed', data: { sceneId: 's2', name: 'Cave' } }
      ]);
    });
  });

  describe('chat, users, pause, time, targets', () => {
    it('reports a chat message from its stored source', () => {
      const { hooks, seen } = setup(['chat-message-created']);
      const message = {
        id: 'm1',
        pack: null,
        _source: {
          author: 'u1',
          speaker: { alias: 'Bob', actor: 'a1', scene: 's1', token: 't1' },
          whisper: ['gm'],
          blind: true,
          rolls: ['{"class":"Roll","formula":"1d20","total":12}'],
          content: '<div class="dice-roll"><h4>12</h4></div>',
          flavor: 'Attack'
        }
      };

      hooks.callAll('createChatMessage', message, {}, 'u1');

      expect(seen).toEqual([
        {
          name: 'chat-message-created',
          data: {
            messageId: 'm1',
            authorId: 'u1',
            speaker: { alias: 'Bob', actorId: 'a1', tokenId: 't1', sceneId: 's1' },
            whisper: ['gm'],
            blind: true,
            hasRolls: true,
            preview: '12'
          }
        }
      ]);
    });

    it('falls back to the flavor and to the Foundry 11 author field', () => {
      const { hooks, seen } = setup(['chat-message-created']);

      hooks.callAll('createChatMessage', { id: 'm2', pack: null, _source: { user: 'u9', content: '', flavor: '<b>Hidden</b>' } }, {}, 'u9');

      expect(seen[0]?.data).toEqual({
        messageId: 'm2',
        authorId: 'u9',
        speaker: { alias: '', actorId: null, tokenId: null, sceneId: null },
        whisper: [],
        blind: false,
        hasRolls: false,
        preview: 'Hidden'
      });
    });

    it('reports users joining and leaving', () => {
      const { hooks, seen } = setup(['user-connected', 'user-disconnected']);
      const user = { id: 'u1', name: 'Ann', isGM: false };

      hooks.callAll('userConnected', user, true);
      hooks.callAll('userConnected', user, false);

      expect(seen).toEqual([
        { name: 'user-connected', data: { userId: 'u1', name: 'Ann', isGM: false } },
        { name: 'user-disconnected', data: { userId: 'u1', name: 'Ann', isGM: false } }
      ]);
    });

    it('reports pause and resume', () => {
      const { hooks, seen } = setup(['game-paused', 'game-resumed']);

      hooks.callAll('pauseGame', true, { broadcast: true });
      hooks.callAll('pauseGame', false, {});

      expect(seen).toEqual([
        { name: 'game-paused', data: { paused: true } },
        { name: 'game-resumed', data: { paused: false } }
      ]);
    });

    it('reports a world time change with its delta', () => {
      const { hooks, seen } = setup(['world-time-changed']);

      hooks.callAll('updateWorldTime', 3600, 60, {}, 'gm');
      hooks.callAll('updateWorldTime', 'bad', 60, {}, 'gm');

      expect(seen).toEqual([{ name: 'world-time-changed', data: { worldTime: 3600, delta: 60, userId: 'gm' } }]);
    });

    it("reports a user's whole target set", () => {
      const { hooks, seen } = setup(['targets-changed']);
      const user = { id: 'u1', name: 'Ann', targets: { ids: ['t1', 't2'] } };

      hooks.callAll('targetToken', user, { id: 't2', document: token({ id: 't2' }) }, true);

      expect(seen).toEqual([
        { name: 'targets-changed', data: { userId: 'u1', userName: 'Ann', sceneId: 's1', tokenIds: ['t1', 't2'] } }
      ]);
    });
  });
});
