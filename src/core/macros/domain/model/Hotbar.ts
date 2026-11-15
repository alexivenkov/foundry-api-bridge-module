import type { MacroType } from './Macro';

/** `User#hotbar`: five pages of ten numbered slots (`User#assignHotbarMacro`, Foundry 13–14). */
export const HOTBAR_SLOT_COUNT = 50;
export const HOTBAR_PAGE_SIZE = 10;
export const HOTBAR_PAGE_COUNT = HOTBAR_SLOT_COUNT / HOTBAR_PAGE_SIZE;

export interface HotbarMacro {
  readonly id: string;
  readonly name: string;
  readonly type: MacroType;
}

export interface HotbarEntry {
  readonly slot: number;
  readonly page: number;
  readonly macroId: string;
  /** Null when the macro was deleted: the core leaves its id on the hotbar. */
  readonly macro: HotbarMacro | null;
}

export interface Hotbar {
  readonly userId: string;
  readonly userName: string;
  /** Only the filled slots, in slot order. */
  readonly entries: readonly HotbarEntry[];
}

/** One write of a slot: a macro, or null to clear it. A move also names the slot the replaced macro goes to. */
export interface HotbarAssignment {
  readonly slot: number;
  readonly macroId: string | null;
  readonly fromSlot?: number | undefined;
}
