import type { Hotbar, HotbarEntry } from '../../model/Hotbar';
import { findHotbarEntry, firstFreeSlot, hotbarPage, isHotbarSlot, pageOfSlot } from '../hotbarSlots';

function entry(slot: number): HotbarEntry {
  return { slot, page: pageOfSlot(slot), macroId: `m${String(slot)}`, macro: null };
}

function hotbar(slots: number[]): Hotbar {
  return { userId: 'u1', userName: 'Gamemaster', entries: slots.map(entry) };
}

describe('hotbar slots', () => {
  it.each([
    [1, 1],
    [10, 1],
    [11, 2],
    [20, 2],
    [41, 5],
    [50, 5]
  ])('puts slot %d on page %d', (slot, page) => {
    expect(pageOfSlot(slot)).toBe(page);
  });

  it.each([1, 25, 50])('knows %d as a slot', (slot) => {
    expect(isHotbarSlot(slot)).toBe(true);
  });

  it.each([0, 51, -1, 2.5, Number.NaN])('rejects %d as a slot', (slot) => {
    expect(isHotbarSlot(slot)).toBe(false);
  });

  it('picks the lowest empty slot, as the core does', () => {
    expect(firstFreeSlot(hotbar([]))).toBe(1);
    expect(firstFreeSlot(hotbar([1, 2, 4]))).toBe(3);
  });

  it('answers null when all fifty slots are taken', () => {
    expect(firstFreeSlot(hotbar(Array.from({ length: 50 }, (_, index) => index + 1)))).toBeNull();
  });

  it('finds the entry of a slot', () => {
    expect(findHotbarEntry(hotbar([3, 7]), 7)?.macroId).toBe('m7');
    expect(findHotbarEntry(hotbar([3, 7]), 4)).toBeNull();
  });

  it('keeps only the entries of one page', () => {
    expect(hotbarPage(hotbar([1, 10, 11, 25]), 2).entries.map((e) => e.slot)).toEqual([11]);
    expect(hotbarPage(hotbar([1, 10, 11, 25]), 4).entries).toEqual([]);
  });
});
