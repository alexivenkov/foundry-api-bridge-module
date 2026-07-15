import { FoundryPackIndexScanner } from '../FoundryPackIndexScanner';
import { makeGame, makeIndex, makePack, providerFor } from './fixtures';
import type { FoundryPack } from '../foundryPackTypes';

describe('FoundryPackIndexScanner', () => {
  it('returns empty list when packs collection is undefined', () => {
    const scanner = new FoundryPackIndexScanner(providerFor(makeGame()));
    expect(scanner.scanPacks()).toEqual([]);
  });

  it('enumerates packs via forEach only (no per-id lookups)', () => {
    const pack = makePack({ collection: 'a.b' });
    const forEachOnly = {
      forEach: (fn: (p: FoundryPack) => void) => {
        fn(pack);
      }
    };
    const scanner = new FoundryPackIndexScanner(
      providerFor(makeGame({ packs: forEachOnly as never }))
    );

    const scanned = scanner.scanPacks();
    expect(scanned).toHaveLength(1);
    expect(scanned[0]?.descriptor).toEqual({
      id: 'a.b',
      label: 'Test Pack',
      type: 'Item',
      system: 'dnd5e'
    });
  });

  it('does not touch getIndex until readEntries is invoked', async () => {
    const getIndex = jest.fn(async () =>
      makeIndex([{ _id: 'e1', name: 'Entry' }], { withContents: false })
    );
    const pack = makePack({ getIndex });
    const scanner = new FoundryPackIndexScanner(
      providerFor(makeGame({ packs: { forEach: fn => fn(pack), get: () => pack } }))
    );

    const scanned = scanner.scanPacks();
    expect(getIndex).not.toHaveBeenCalled();

    const entries = await scanned[0]?.readEntries();
    expect(getIndex).toHaveBeenCalledWith();
    expect(entries).toEqual([{ id: 'e1', name: 'Entry', img: null, type: null }]);
  });

  it('falls back system to empty string in descriptors', () => {
    const pack = makePack({ metadata: { label: 'L', type: 'JournalEntry' } });
    const scanner = new FoundryPackIndexScanner(
      providerFor(makeGame({ packs: { forEach: fn => fn(pack), get: () => pack } }))
    );
    expect(scanner.scanPacks()[0]?.descriptor.system).toBe('');
  });
});
