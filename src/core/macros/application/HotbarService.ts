import {
  CurrentUserUnknownError,
  HotbarFullError,
  HotbarSlotEmptyError,
  HotbarUserNotFoundError,
  MacroNotFoundError,
  findHotbarEntry,
  firstFreeSlot,
  hotbarPage,
  type Hotbar,
  type HotbarAssignment,
  type HotbarStore
} from '@/core/macros/domain';
import type {
  AssignHotbarSlotCommand,
  ClearHotbarSlotCommand,
  GetHotbarQuery,
  MoveHotbarSlotCommand
} from './hotbarCommands';

export interface HotbarServiceDependencies {
  readonly hotbars: HotbarStore;
}

export interface HotbarView {
  readonly hotbar: Hotbar;
  readonly page: number | null;
}

export interface HotbarSlotAssigned {
  readonly hotbar: Hotbar;
  readonly slot: number;
  readonly replacedMacroId: string | null;
}

export interface HotbarSlotMoved {
  readonly hotbar: Hotbar;
  readonly fromSlot: number;
  readonly toSlot: number;
  readonly macroId: string;
  readonly swappedMacroId: string | null;
}

export interface HotbarSlotCleared {
  readonly hotbar: Hotbar;
  readonly slot: number;
  readonly clearedMacroId: string | null;
}

/** Results carry the whole hotbar as it reads after the write. */
export class HotbarService {
  constructor(private readonly deps: HotbarServiceDependencies) {}

  getHotbar(query: GetHotbarQuery): HotbarView {
    const hotbar = this.requireHotbar(query.userId);
    return query.page === undefined
      ? { hotbar, page: null }
      : { hotbar: hotbarPage(hotbar, query.page), page: query.page };
  }

  async assignSlot(command: AssignHotbarSlotCommand): Promise<HotbarSlotAssigned> {
    const hotbar = this.requireHotbar(command.userId);
    if (this.deps.hotbars.findMacro(command.macroId) === null) {
      throw new MacroNotFoundError(command.macroId);
    }
    const slot = command.slot ?? firstFreeSlot(hotbar);
    if (slot === null) {
      throw new HotbarFullError();
    }
    const replacedMacroId = findHotbarEntry(hotbar, slot)?.macroId ?? null;

    const after = await this.write(hotbar.userId, { slot, macroId: command.macroId });
    return { hotbar: after, slot, replacedMacroId };
  }

  /** The core API moves only a macro that still exists, so a slot left over from a deleted macro can only be cleared. */
  async moveSlot(command: MoveHotbarSlotCommand): Promise<HotbarSlotMoved> {
    const hotbar = this.requireHotbar(command.userId);
    const moved = findHotbarEntry(hotbar, command.fromSlot);
    if (moved === null) {
      throw new HotbarSlotEmptyError(command.fromSlot);
    }
    if (moved.macro === null) {
      throw new MacroNotFoundError(moved.macroId);
    }
    const swappedMacroId = findHotbarEntry(hotbar, command.toSlot)?.macroId ?? null;

    const after = await this.write(hotbar.userId, {
      slot: command.toSlot,
      macroId: moved.macroId,
      fromSlot: command.fromSlot
    });
    return { hotbar: after, fromSlot: command.fromSlot, toSlot: command.toSlot, macroId: moved.macroId, swappedMacroId };
  }

  /** Clearing an empty slot writes nothing. */
  async clearSlot(command: ClearHotbarSlotCommand): Promise<HotbarSlotCleared> {
    const hotbar = this.requireHotbar(command.userId);
    const cleared = findHotbarEntry(hotbar, command.slot);
    if (cleared === null) {
      return { hotbar, slot: command.slot, clearedMacroId: null };
    }
    const after = await this.write(hotbar.userId, { slot: command.slot, macroId: null });
    return { hotbar: after, slot: command.slot, clearedMacroId: cleared.macroId };
  }

  private requireHotbar(userId: string | undefined): Hotbar {
    const id = userId ?? this.deps.hotbars.currentUserId();
    if (id === null) {
      throw new CurrentUserUnknownError();
    }
    const hotbar = this.deps.hotbars.findHotbar(id);
    if (hotbar === null) {
      throw new HotbarUserNotFoundError(id);
    }
    return hotbar;
  }

  private async write(userId: string, assignment: HotbarAssignment): Promise<Hotbar> {
    await this.deps.hotbars.assign(userId, assignment);
    return this.requireHotbar(userId);
  }
}
