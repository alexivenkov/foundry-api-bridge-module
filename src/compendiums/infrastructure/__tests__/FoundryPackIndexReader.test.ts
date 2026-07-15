import { PackNotFoundError } from '../../domain';
import { FoundryPackIndexReader } from '../FoundryPackIndexReader';
import { makeGame, makeIndex, makePack, makePacksCollection, providerFor } from './fixtures';

function readerFor(packs: ReturnType<typeof makePack>[]): FoundryPackIndexReader {
  return new FoundryPackIndexReader(
    providerFor(makeGame({ packs: makePacksCollection(packs) }))
  );
}

describe('FoundryPackIndexReader', () => {
  it('reads and maps index entries via contents', async () => {
    const pack = makePack({
      getIndex: jest.fn(async () =>
        makeIndex([{ _id: 'a', name: 'Alpha', img: 'a.png', type: 'spell' }])
      )
    });

    const entries = await readerFor([pack]).readIndex('world.test-pack');
    expect(entries).toEqual([{ id: 'a', name: 'Alpha', img: 'a.png', type: 'spell' }]);
  });

  it('falls back to forEach when index has no contents array', async () => {
    const pack = makePack({
      getIndex: jest.fn(async () =>
        makeIndex([{ _id: 'b', name: 'Beta' }], { withContents: false })
      )
    });

    const entries = await readerFor([pack]).readIndex('world.test-pack');
    expect(entries).toEqual([{ id: 'b', name: 'Beta', img: null, type: null }]);
  });

  it('passes fields to getIndex and populates entry fields', async () => {
    const getIndex = jest.fn(async () =>
      makeIndex([{ _id: 'c', name: 'C', system: { level: 4 } }])
    );
    const pack = makePack({ getIndex });

    const entries = await readerFor([pack]).readIndex('world.test-pack', ['system.level']);
    expect(getIndex).toHaveBeenCalledWith({ fields: ['system.level'] });
    expect(entries[0]?.fields).toEqual({ 'system.level': 4 });
  });

  it('calls getIndex with an empty options object when no fields requested', async () => {
    const getIndex = jest.fn(async () => makeIndex([]));
    const pack = makePack({ getIndex });

    await readerFor([pack]).readIndex('world.test-pack');
    expect(getIndex).toHaveBeenCalledWith({});
  });

  it('treats an empty fields array as no fields', async () => {
    const getIndex = jest.fn(async () => makeIndex([{ _id: 'd' }]));
    const pack = makePack({ getIndex });

    const entries = await readerFor([pack]).readIndex('world.test-pack', []);
    expect(getIndex).toHaveBeenCalledWith({});
    expect(entries[0]).not.toHaveProperty('fields');
  });

  it('throws PackNotFoundError for unknown pack', async () => {
    await expect(readerFor([]).readIndex('ghost')).rejects.toThrow(PackNotFoundError);
    await expect(readerFor([]).readIndex('ghost')).rejects.toThrow('Pack not found: ghost');
  });

  it('throws PackNotFoundError when packs collection is undefined', async () => {
    const reader = new FoundryPackIndexReader(providerFor(makeGame()));
    await expect(reader.readIndex('any')).rejects.toThrow(PackNotFoundError);
  });
});
