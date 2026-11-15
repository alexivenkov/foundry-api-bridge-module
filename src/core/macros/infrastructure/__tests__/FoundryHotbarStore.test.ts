import { FoundryHotbarStore } from '../FoundryHotbarStore';
import type { FoundryHotbarGame, FoundryHotbarMacro, FoundryHotbarUser } from '../foundryHotbarTypes';

interface World {
  store: FoundryHotbarStore;
  user: FoundryHotbarUser;
  assign: jest.Mock;
  macros: Map<string, FoundryHotbarMacro>;
}

// `User#hotbar` as the core keeps it: an object of slot "1"–"50" → macro id (probed on 13.351 and 14.368).
function world(hotbar: Record<string, string> | null = { '12': 'heal', '1': 'attack', '3': 'deletedMacroId' }): World {
  const macros = new Map<string, FoundryHotbarMacro>([
    ['attack', { id: 'attack', name: 'Attack', type: 'chat' }],
    ['heal', { id: 'heal', name: 'Heal', type: 'script' }]
  ]);
  const assign = jest.fn().mockResolvedValue(undefined);
  const user: FoundryHotbarUser = { id: 'gm', name: 'Gamemaster', hotbar, assignHotbarMacro: assign };
  const game: FoundryHotbarGame = {
    users: { get: (id) => (id === 'gm' ? user : undefined) },
    user: { id: 'gm' },
    macros: { get: (id) => macros.get(id) }
  };
  return { store: new FoundryHotbarStore(() => ({ game })), user, assign, macros };
}

describe('FoundryHotbarStore', () => {
  it('answers the user the module runs as', () => {
    expect(world().store.currentUserId()).toBe('gm');
    expect(new FoundryHotbarStore(() => ({ game: { users: { get: () => undefined }, macros: { get: () => undefined } } })).currentUserId()).toBeNull();
  });

  it('reads the filled slots in slot order, with their page and macro', () => {
    expect(world().store.findHotbar('gm')).toEqual({
      userId: 'gm',
      userName: 'Gamemaster',
      entries: [
        { slot: 1, page: 1, macroId: 'attack', macro: { id: 'attack', name: 'Attack', type: 'chat' } },
        { slot: 3, page: 1, macroId: 'deletedMacroId', macro: null },
        { slot: 12, page: 2, macroId: 'heal', macro: { id: 'heal', name: 'Heal', type: 'script' } }
      ]
    });
  });

  it('skips keys that are not slots and reads an absent hotbar as empty', () => {
    expect(world({ '0': 'attack', '51': 'attack', x: 'attack', '2': '' }).store.findHotbar('gm')?.entries).toEqual([]);
    expect(world(null).store.findHotbar('gm')?.entries).toEqual([]);
  });

  it('answers null for an unknown user and an unknown macro', () => {
    const { store } = world();

    expect(store.findHotbar('nobody')).toBeNull();
    expect(store.findMacro('nope')).toBeNull();
    expect(store.findMacro('heal')).toEqual({ id: 'heal', name: 'Heal', type: 'script' });
  });

  it('hands the Macro document itself to assignHotbarMacro', async () => {
    const { store, assign, macros } = world();

    await store.assign('gm', { slot: 5, macroId: 'heal' });

    expect(assign).toHaveBeenCalledWith(macros.get('heal'), 5, {});
  });

  it('passes fromSlot for a move and null to clear a slot', async () => {
    const { store, assign, macros } = world();

    await store.assign('gm', { slot: 9, macroId: 'attack', fromSlot: 1 });
    await store.assign('gm', { slot: 3, macroId: null });

    expect(assign).toHaveBeenNthCalledWith(1, macros.get('attack'), 9, { fromSlot: 1 });
    expect(assign).toHaveBeenNthCalledWith(2, null, 3, {});
  });

  it('refuses a user or a macro that vanished in the meantime', async () => {
    const { store, assign } = world();

    await expect(store.assign('nobody', { slot: 1, macroId: null })).rejects.toThrow('User not found: nobody');
    await expect(store.assign('gm', { slot: 1, macroId: 'nope' })).rejects.toThrow('Macro not found: nope');
    expect(assign).not.toHaveBeenCalled();
  });
});
