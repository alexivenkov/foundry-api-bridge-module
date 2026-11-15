import {
  HOTBAR_PAGE_SIZE,
  HOTBAR_SLOT_COUNT,
  type Hotbar,
  type HotbarEntry
} from '@/core/macros/domain/model/Hotbar';

export function pageOfSlot(slot: number): number {
  return Math.ceil(slot / HOTBAR_PAGE_SIZE);
}

export function isHotbarSlot(slot: number): boolean {
  return Number.isInteger(slot) && slot >= 1 && slot <= HOTBAR_SLOT_COUNT;
}

export function findHotbarEntry(hotbar: Hotbar, slot: number): HotbarEntry | null {
  return hotbar.entries.find((entry) => entry.slot === slot) ?? null;
}

/** The slot the core fills when it is given none: the lowest empty one. */
export function firstFreeSlot(hotbar: Hotbar): number | null {
  const taken = new Set(hotbar.entries.map((entry) => entry.slot));
  for (let slot = 1; slot <= HOTBAR_SLOT_COUNT; slot += 1) {
    if (!taken.has(slot)) {
      return slot;
    }
  }
  return null;
}

export function hotbarPage(hotbar: Hotbar, page: number): Hotbar {
  return { ...hotbar, entries: hotbar.entries.filter((entry) => entry.page === page) };
}
