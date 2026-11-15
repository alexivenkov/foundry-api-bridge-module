import type { HotbarSlot, HotbarSnapshot } from '@/commands/types';
import type { Hotbar, HotbarEntry } from '@/core/macros';

function toWireHotbarSlot(entry: HotbarEntry): HotbarSlot {
  return {
    slot: entry.slot,
    page: entry.page,
    macroId: entry.macroId,
    macroName: entry.macro?.name ?? null,
    macroType: entry.macro?.type ?? null
  };
}

export function toWireHotbar(hotbar: Hotbar): HotbarSnapshot {
  return { userId: hotbar.userId, userName: hotbar.userName, slots: hotbar.entries.map(toWireHotbarSlot) };
}
