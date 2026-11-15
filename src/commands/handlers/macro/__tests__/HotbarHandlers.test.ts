import type { FoundryHotbarGame, FoundryHotbarUser } from '../../../../core/macros/infrastructure';
import { createAssignHotbarSlotHandler } from '../AssignHotbarSlotHandler';
import { createClearHotbarSlotHandler } from '../ClearHotbarSlotHandler';
import { createGetHotbarHandler, type HotbarHandlerDependencies } from '../GetHotbarHandler';
import { createMoveHotbarSlotHandler } from '../MoveHotbarSlotHandler';

interface World {
  deps: HotbarHandlerDependencies;
  gm: FoundryHotbarUser;
  player: FoundryHotbarUser;
}

/** A user whose `assignHotbarMacro` changes its hotbar the way the core's does. */
function user(id: string, name: string, hotbar: Record<string, string>): FoundryHotbarUser {
  const self: FoundryHotbarUser = {
    id,
    name,
    hotbar,
    assignHotbarMacro: jest.fn((macro: { id: string } | null, slot: number, options: { fromSlot?: number } = {}) => {
      const update = { ...self.hotbar };
      const current = update[String(slot)];
      if (macro) {
        update[String(slot)] = macro.id;
      } else {
        delete update[String(slot)];
      }
      if (options.fromSlot !== undefined) {
        if (current !== undefined) {
          update[String(options.fromSlot)] = current;
        } else {
          delete update[String(options.fromSlot)];
        }
      }
      self.hotbar = update;
      return Promise.resolve(self);
    })
  };
  return self;
}

function world(): World {
  const gm = user('gm', 'Gamemaster', { '1': 'attack' });
  const player = user('p1', 'Player', { '11': 'heal' });
  const macros = new Map([
    ['attack', { id: 'attack', name: 'Attack', type: 'chat' }],
    ['heal', { id: 'heal', name: 'Heal', type: 'script' }]
  ]);
  const users = new Map([
    ['gm', gm],
    ['p1', player]
  ]);
  const game: FoundryHotbarGame = {
    users: { get: (id) => users.get(id) },
    user: { id: 'gm' },
    macros: { get: (id) => macros.get(id) }
  };
  return { deps: { globals: () => ({ game }) }, gm, player };
}

describe('hotbar handlers', () => {
  it('get-hotbar reads the GM hotbar by default', async () => {
    const { deps } = world();

    await expect(createGetHotbarHandler(deps)({})).resolves.toEqual({
      userId: 'gm',
      userName: 'Gamemaster',
      page: null,
      slots: [{ slot: 1, page: 1, macroId: 'attack', macroName: 'Attack', macroType: 'chat' }]
    });
  });

  it('get-hotbar reads one page of another user', async () => {
    const { deps } = world();

    const result = await createGetHotbarHandler(deps)({ userId: 'p1', page: 2 });

    expect(result.page).toBe(2);
    expect(result.slots).toEqual([{ slot: 11, page: 2, macroId: 'heal', macroName: 'Heal', macroType: 'script' }]);
  });

  it('get-hotbar rejects an invalid page and an unknown user', async () => {
    const { deps } = world();

    await expect(createGetHotbarHandler(deps)({ page: 9 })).rejects.toThrow('page');
    await expect(createGetHotbarHandler(deps)({ userId: 'nobody' })).rejects.toThrow('User not found: nobody');
  });

  it('assign-hotbar-slot puts a macro on a player hotbar and answers the whole bar', async () => {
    const { deps, player } = world();

    const result = await createAssignHotbarSlotHandler(deps)({ userId: 'p1', macroId: 'attack', slot: 11 });

    expect(player.assignHotbarMacro).toHaveBeenCalledWith(expect.objectContaining({ id: 'attack' }), 11, {});
    expect(result).toEqual({
      userId: 'p1',
      userName: 'Player',
      slots: [{ slot: 11, page: 2, macroId: 'attack', macroName: 'Attack', macroType: 'chat' }],
      slot: 11,
      replacedMacroId: 'heal'
    });
  });

  it('assign-hotbar-slot refuses an unknown macro', async () => {
    await expect(createAssignHotbarSlotHandler(world().deps)({ macroId: 'nope' })).rejects.toThrow(
      'Macro not found: nope'
    );
  });

  it('move-hotbar-slot moves through assignHotbarMacro with fromSlot', async () => {
    const { deps, gm } = world();

    const result = await createMoveHotbarSlotHandler(deps)({ fromSlot: 1, toSlot: 2 });

    expect(gm.assignHotbarMacro).toHaveBeenCalledWith(expect.objectContaining({ id: 'attack' }), 2, { fromSlot: 1 });
    expect(result.slots.map((slot) => slot.slot)).toEqual([2]);
    expect(result).toMatchObject({ fromSlot: 1, toSlot: 2, macroId: 'attack', swappedMacroId: null });
  });

  it('move-hotbar-slot rejects an empty source and the same slot twice', async () => {
    const { deps } = world();

    await expect(createMoveHotbarSlotHandler(deps)({ fromSlot: 5, toSlot: 6 })).rejects.toThrow(
      'Hotbar slot 5 is empty'
    );
    await expect(createMoveHotbarSlotHandler(deps)({ fromSlot: 1, toSlot: 1 })).rejects.toThrow('toSlot');
  });

  it('clear-hotbar-slot empties the slot', async () => {
    const { deps, gm } = world();

    const result = await createClearHotbarSlotHandler(deps)({ slot: 1, userId: '' });

    expect(gm.assignHotbarMacro).toHaveBeenCalledWith(null, 1, {});
    expect(result).toEqual({ userId: 'gm', userName: 'Gamemaster', slots: [], slot: 1, clearedMacroId: 'attack' });
  });
});
