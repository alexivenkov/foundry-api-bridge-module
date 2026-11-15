import { hasActivities, matchesInventoryFilter, type InventoryFilter, type InventoryItem } from '../model/OwnedItem';

function item(overrides: Partial<InventoryItem> = {}, traits: Partial<InventoryItem['traits']> = {}): InventoryItem {
  return {
    id: 'i1',
    name: 'Longsword',
    type: 'weapon',
    img: 'sword.webp',
    traits: {
      equipped: true,
      quantity: 1,
      activityTypes: ['attack'],
      description: '',
      damage: null,
      range: null,
      ...traits
    },
    ...overrides
  };
}

const ANY: InventoryFilter = { type: undefined, equipped: undefined, hasActivities: undefined };

describe('hasActivities', () => {
  it('is true when the item offers at least one activity', () => {
    expect(hasActivities(item())).toBe(true);
    expect(hasActivities(item({}, { activityTypes: [] }))).toBe(false);
  });
});

describe('matchesInventoryFilter', () => {
  it('lets every item through an empty filter', () => {
    expect(matchesInventoryFilter(item(), ANY)).toBe(true);
    expect(matchesInventoryFilter(item({ type: 'loot' }, { equipped: false, activityTypes: [] }), ANY)).toBe(true);
  });

  it('filters by item type', () => {
    expect(matchesInventoryFilter(item(), { ...ANY, type: 'weapon' })).toBe(true);
    expect(matchesInventoryFilter(item(), { ...ANY, type: 'equipment' })).toBe(false);
  });

  it('filters by equipped state, in either direction', () => {
    const stowed = item({}, { equipped: false });

    expect(matchesInventoryFilter(item(), { ...ANY, equipped: true })).toBe(true);
    expect(matchesInventoryFilter(stowed, { ...ANY, equipped: true })).toBe(false);
    expect(matchesInventoryFilter(stowed, { ...ANY, equipped: false })).toBe(true);
  });

  it('filters by whether the item has activities, in either direction', () => {
    const inert = item({}, { activityTypes: [] });

    expect(matchesInventoryFilter(item(), { ...ANY, hasActivities: true })).toBe(true);
    expect(matchesInventoryFilter(inert, { ...ANY, hasActivities: true })).toBe(false);
    expect(matchesInventoryFilter(inert, { ...ANY, hasActivities: false })).toBe(true);
  });

  it('requires every condition that is set', () => {
    const filter: InventoryFilter = { type: 'weapon', equipped: true, hasActivities: true };

    expect(matchesInventoryFilter(item(), filter)).toBe(true);
    expect(matchesInventoryFilter(item({}, { equipped: false }), filter)).toBe(false);
    expect(matchesInventoryFilter(item({ type: 'consumable' }), filter)).toBe(false);
  });
});
