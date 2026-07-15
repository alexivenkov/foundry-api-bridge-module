import { PackNotFoundError } from '../../domain';
import { FoundryPackSearchEngine } from '../FoundryPackSearchEngine';
import { makeGame, makeIndex, makePack, makePacksCollection, providerFor } from './fixtures';
import type { RawIndexEntry } from '../foundryPackTypes';

function engineFor(packs: ReturnType<typeof makePack>[]): FoundryPackSearchEngine {
  return new FoundryPackSearchEngine(
    providerFor(makeGame({ packs: makePacksCollection(packs) }))
  );
}

describe('FoundryPackSearchEngine', () => {
  it('passes query through and maps array results', async () => {
    const search = jest.fn(() => [
      { _id: 'r1', name: 'Fireball', img: null, type: 'spell' } as RawIndexEntry
    ]);
    const pack = makePack({ search });

    const results = await engineFor([pack]).searchIndex('world.test-pack', {
      query: 'fire'
    });

    expect(search).toHaveBeenCalledWith({ query: 'fire' });
    expect(results).toEqual([{ id: 'r1', name: 'Fireball', img: null, type: 'spell' }]);
  });

  it('translates wire operators into foundry operator values', async () => {
    const search = jest.fn(() => [] as RawIndexEntry[]);
    const pack = makePack({ search });

    await engineFor([pack]).searchIndex('world.test-pack', {
      filters: [
        { field: 'type', operator: 'EQUALS', value: 'spell', negate: false },
        { field: 'system.level', operator: 'GREATER_THAN', value: 2, negate: true }
      ]
    });

    expect(search).toHaveBeenCalledWith({
      filters: [
        { field: 'type', operator: 'equals', value: 'spell', negate: false },
        { field: 'system.level', operator: 'gt', value: 2, negate: true }
      ]
    });
  });

  it('passes exclude list through', async () => {
    const search = jest.fn(() => [] as RawIndexEntry[]);
    const pack = makePack({ search });

    await engineFor([pack]).searchIndex('world.test-pack', { exclude: ['x1', 'x2'] });
    expect(search).toHaveBeenCalledWith({ exclude: ['x1', 'x2'] });
  });

  it('pre-indexes requested fields and populates them on results', async () => {
    const getIndex = jest.fn(async () => makeIndex([]));
    const search = jest.fn(() => [
      { _id: 'r2', name: 'Shield', system: { level: 1 } } as RawIndexEntry
    ]);
    const pack = makePack({ getIndex, search });

    const results = await engineFor([pack]).searchIndex('world.test-pack', {
      fields: ['system.level']
    });

    expect(getIndex).toHaveBeenCalledWith({ fields: ['system.level'] });
    expect(results[0]?.fields).toEqual({ 'system.level': 1 });
  });

  it('does not call getIndex when no fields requested', async () => {
    const getIndex = jest.fn(async () => makeIndex([]));
    const pack = makePack({ getIndex });

    await engineFor([pack]).searchIndex('world.test-pack', { query: 'x' });
    expect(getIndex).not.toHaveBeenCalled();
  });

  it('normalizes Set<string> results via pack.index.get and skips missing ids', async () => {
    const entries: RawIndexEntry[] = [{ _id: 's1', name: 'Known' }];
    const pack = makePack({
      index: makeIndex(entries),
      search: jest.fn(() => new Set(['s1', 'missing']))
    });

    const results = await engineFor([pack]).searchIndex('world.test-pack', {});
    expect(results).toEqual([{ id: 's1', name: 'Known', img: null, type: null }]);
  });

  it('throws PackNotFoundError for unknown pack', async () => {
    await expect(engineFor([]).searchIndex('ghost', {})).rejects.toThrow(
      'Pack not found: ghost'
    );
    await expect(engineFor([]).searchIndex('ghost', {})).rejects.toThrow(
      PackNotFoundError
    );
  });
});
