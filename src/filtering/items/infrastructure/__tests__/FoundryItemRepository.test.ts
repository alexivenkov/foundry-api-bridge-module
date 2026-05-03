import { ItemType } from '@/filtering/items/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

import { FoundryItemMapper } from '../FoundryItemMapper';
import { FoundryItemRepository } from '../FoundryItemRepository';
import type { FoundryItem, FoundryItemGameGlobals } from '../foundryItemTypes';
import type { FoundryItemGameProvider } from '../foundryGameProvider';

function snapshotStub(id: string): ItemSnapshot {
  return {
    id,
    name: `Item ${id}`,
    type: ItemType.Loot,
    folderId: null,
    rarity: null,
    identified: null,
    requiresAttunement: null,
    weight: null,
    priceGp: null,
    spellLevel: null,
    spellSchool: null,
    hasActivities: false,
    isContainer: false
  };
}

function rawStub(id: string): FoundryItem {
  return {
    id,
    name: `Item ${id}`,
    type: 'loot',
    folder: null,
    system: {}
  };
}

function makeProvider(items: readonly FoundryItem[]): {
  provider: FoundryItemGameProvider;
  spy: jest.Mock;
} {
  const game: FoundryItemGameGlobals = {
    items: { contents: items },
    folders: { get: jest.fn(), contents: [] }
  };
  const spy = jest.fn(() => game);
  return { provider: { getGame: spy }, spy };
}

describe('FoundryItemRepository', () => {
  it('returns an empty array when there are no items', async () => {
    const { provider } = makeProvider([]);
    const mapper = new FoundryItemMapper();
    const repo = new FoundryItemRepository(provider, mapper);

    const result = await repo.findAll();
    expect(result).toEqual([]);
  });

  it('returns one snapshot per item in collection order', async () => {
    const raws = [rawStub('i1'), rawStub('i2'), rawStub('i3')];
    const { provider } = makeProvider(raws);
    const mapper = new FoundryItemMapper();
    const repo = new FoundryItemRepository(provider, mapper);

    const result = await repo.findAll();
    expect(result.map((s) => s.id)).toEqual(['i1', 'i2', 'i3']);
  });

  it('delegates each item to mapper.toSnapshot', async () => {
    const raws = [rawStub('i1'), rawStub('i2')];
    const { provider } = makeProvider(raws);
    const mapper = new FoundryItemMapper();
    const toSnapshotSpy = jest
      .spyOn(mapper, 'toSnapshot')
      .mockImplementation((raw: FoundryItem) => snapshotStub(raw.id));
    const repo = new FoundryItemRepository(provider, mapper);

    const result = await repo.findAll();

    expect(toSnapshotSpy).toHaveBeenCalledTimes(2);
    expect(toSnapshotSpy).toHaveBeenNthCalledWith(1, raws[0]);
    expect(toSnapshotSpy).toHaveBeenNthCalledWith(2, raws[1]);
    expect(result).toEqual([snapshotStub('i1'), snapshotStub('i2')]);
  });

  it('calls gameProvider.getGame exactly once per findAll', async () => {
    const { provider, spy } = makeProvider([rawStub('i1')]);
    const repo = new FoundryItemRepository(provider, new FoundryItemMapper());

    await repo.findAll();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('returns a Promise (matches FilterableRepository contract)', () => {
    const { provider } = makeProvider([]);
    const repo = new FoundryItemRepository(provider, new FoundryItemMapper());

    const result = repo.findAll();
    expect(result).toBeInstanceOf(Promise);
  });
});
