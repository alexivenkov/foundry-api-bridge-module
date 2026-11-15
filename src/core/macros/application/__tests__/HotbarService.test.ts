import {
  CurrentUserUnknownError,
  HotbarFullError,
  HotbarSlotEmptyError,
  HotbarUserNotFoundError,
  MacroNotFoundError,
  pageOfSlot,
  type Hotbar,
  type HotbarAssignment,
  type HotbarMacro,
  type HotbarStore
} from '../../domain';
import { HotbarService } from '../HotbarService';

const MACROS: Record<string, HotbarMacro> = {
  attack: { id: 'attack', name: 'Attack', type: 'chat' },
  heal: { id: 'heal', name: 'Heal', type: 'script' },
  torch: { id: 'torch', name: 'Torch', type: 'chat' }
};

/** Applies writes the way `User#assignHotbarMacro` does: the replaced macro moves to `fromSlot`. */
class FakeHotbarStore implements HotbarStore {
  readonly writes: { userId: string; assignment: HotbarAssignment }[] = [];
  current: string | null = 'gm';
  readonly bars = new Map<string, { name: string; slots: Map<number, string> }>([
    ['gm', { name: 'Gamemaster', slots: new Map([[1, 'attack'], [3, 'gone']]) }],
    ['p1', { name: 'Player', slots: new Map([[12, 'heal']]) }]
  ]);

  currentUserId(): string | null {
    return this.current;
  }

  findHotbar(userId: string): Hotbar | null {
    const bar = this.bars.get(userId);
    if (bar === undefined) {
      return null;
    }
    const entries = [...bar.slots.entries()]
      .sort(([a], [b]) => a - b)
      .map(([slot, macroId]) => ({ slot, page: pageOfSlot(slot), macroId, macro: MACROS[macroId] ?? null }));
    return { userId, userName: bar.name, entries };
  }

  findMacro(macroId: string): HotbarMacro | null {
    return MACROS[macroId] ?? null;
  }

  assign(userId: string, assignment: HotbarAssignment): Promise<void> {
    this.writes.push({ userId, assignment });
    const slots = this.bars.get(userId)?.slots ?? new Map<number, string>();
    const current = slots.get(assignment.slot);
    if (assignment.macroId === null) {
      slots.delete(assignment.slot);
    } else {
      slots.set(assignment.slot, assignment.macroId);
    }
    if (assignment.fromSlot !== undefined) {
      if (current !== undefined) {
        slots.set(assignment.fromSlot, current);
      } else {
        slots.delete(assignment.fromSlot);
      }
    }
    return Promise.resolve();
  }
}

function setup(): { store: FakeHotbarStore; service: HotbarService } {
  const store = new FakeHotbarStore();
  return { store, service: new HotbarService({ hotbars: store }) };
}

describe('HotbarService', () => {
  describe('getHotbar', () => {
    it('reads the hotbar of the user the module runs as by default', () => {
      const view = setup().service.getHotbar({ userId: undefined, page: undefined });

      expect(view.page).toBeNull();
      expect(view.hotbar.userId).toBe('gm');
      expect(view.hotbar.entries.map((e) => [e.slot, e.macroId, e.macro?.name ?? null])).toEqual([
        [1, 'attack', 'Attack'],
        [3, 'gone', null]
      ]);
    });

    it('reads another user by id and only one page when asked', () => {
      const { service } = setup();

      expect(service.getHotbar({ userId: 'p1', page: 2 }).hotbar.entries.map((e) => e.slot)).toEqual([12]);
      expect(service.getHotbar({ userId: 'p1', page: 1 })).toEqual({
        hotbar: { userId: 'p1', userName: 'Player', entries: [] },
        page: 1
      });
    });

    it('refuses an unknown user', () => {
      expect(() => setup().service.getHotbar({ userId: 'nobody', page: undefined })).toThrow(
        new HotbarUserNotFoundError('nobody')
      );
    });

    it('refuses to guess the user before the game knows it', () => {
      const { store, service } = setup();
      store.current = null;

      expect(() => service.getHotbar({ userId: undefined, page: undefined })).toThrow(CurrentUserUnknownError);
    });
  });

  describe('assignSlot', () => {
    it('fills the first free slot when none is given', async () => {
      const { store, service } = setup();

      const result = await service.assignSlot({ userId: undefined, macroId: 'torch', slot: undefined });

      expect(store.writes).toEqual([{ userId: 'gm', assignment: { slot: 2, macroId: 'torch' } }]);
      expect(result.slot).toBe(2);
      expect(result.replacedMacroId).toBeNull();
      expect(result.hotbar.entries.map((e) => e.slot)).toEqual([1, 2, 3]);
    });

    it('replaces the macro of a given slot and reports it', async () => {
      const { service } = setup();

      const result = await service.assignSlot({ userId: undefined, macroId: 'heal', slot: 1 });

      expect(result.replacedMacroId).toBe('attack');
      expect(result.hotbar.entries[0]?.macroId).toBe('heal');
    });

    it('refuses a macro that does not exist, before writing', async () => {
      const { store, service } = setup();

      await expect(service.assignSlot({ userId: undefined, macroId: 'nope', slot: 5 })).rejects.toThrow(
        new MacroNotFoundError('nope')
      );
      expect(store.writes).toEqual([]);
    });

    it('refuses when every slot is taken', async () => {
      const { store, service } = setup();
      const full = store.bars.get('gm');
      for (let slot = 1; slot <= 50; slot += 1) {
        full?.slots.set(slot, 'attack');
      }

      await expect(service.assignSlot({ userId: undefined, macroId: 'torch', slot: undefined })).rejects.toThrow(
        HotbarFullError
      );
    });

    it('refuses an unknown user', async () => {
      await expect(setup().service.assignSlot({ userId: 'x', macroId: 'torch', slot: 1 })).rejects.toThrow(
        'User not found: x'
      );
    });
  });

  describe('moveSlot', () => {
    it('moves a macro into an empty slot', async () => {
      const { store, service } = setup();

      const result = await service.moveSlot({ userId: undefined, fromSlot: 1, toSlot: 9 });

      expect(store.writes).toEqual([{ userId: 'gm', assignment: { slot: 9, macroId: 'attack', fromSlot: 1 } }]);
      expect(result).toMatchObject({ fromSlot: 1, toSlot: 9, macroId: 'attack', swappedMacroId: null });
      expect(result.hotbar.entries.map((e) => e.slot)).toEqual([3, 9]);
    });

    it('swaps with the macro already in the target slot', async () => {
      const { service } = setup();

      const result = await service.moveSlot({ userId: 'p1', fromSlot: 12, toSlot: 13 });
      const swapped = await service.moveSlot({ userId: undefined, fromSlot: 1, toSlot: 3 });

      expect(result.swappedMacroId).toBeNull();
      expect(swapped.swappedMacroId).toBe('gone');
      expect(swapped.hotbar.entries.map((e) => [e.slot, e.macroId])).toEqual([
        [1, 'gone'],
        [3, 'attack']
      ]);
    });

    it('refuses an empty source slot', async () => {
      await expect(setup().service.moveSlot({ userId: undefined, fromSlot: 2, toSlot: 5 })).rejects.toThrow(
        new HotbarSlotEmptyError(2)
      );
    });

    it('refuses to move a slot whose macro was deleted: it can only be cleared', async () => {
      const { store, service } = setup();

      await expect(service.moveSlot({ userId: undefined, fromSlot: 3, toSlot: 5 })).rejects.toThrow(
        'Macro not found: gone'
      );
      expect(store.writes).toEqual([]);
    });
  });

  describe('clearSlot', () => {
    it('clears a slot, even one left over from a deleted macro', async () => {
      const { store, service } = setup();

      const result = await service.clearSlot({ userId: undefined, slot: 3 });

      expect(store.writes).toEqual([{ userId: 'gm', assignment: { slot: 3, macroId: null } }]);
      expect(result.clearedMacroId).toBe('gone');
      expect(result.hotbar.entries.map((e) => e.slot)).toEqual([1]);
    });

    it('writes nothing for an empty slot', async () => {
      const { store, service } = setup();

      const result = await service.clearSlot({ userId: undefined, slot: 40 });

      expect(store.writes).toEqual([]);
      expect(result).toMatchObject({ slot: 40, clearedMacroId: null });
    });
  });
});
