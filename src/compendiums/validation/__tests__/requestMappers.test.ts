import {
  toAddItemToActorCommand,
  toGetPackContentsQuery,
  toImportActorCommand,
  toSearchAcrossPacksQuery,
  toSearchInPackQuery,
  toSearchJournalPagesQuery
} from '../requestMappers';

describe('toGetPackContentsQuery', () => {
  it('omits the filter when neither types nor ids are given', () => {
    expect(toGetPackContentsQuery({ packId: 'p' })).toEqual({ packId: 'p' });
  });

  it('builds a filter from types and/or ids, keeping empty arrays', () => {
    expect(toGetPackContentsQuery({ packId: 'p', types: ['spell'] })).toEqual({
      packId: 'p',
      filter: { types: ['spell'] }
    });
    expect(toGetPackContentsQuery({ packId: 'p', ids: ['a', 'b'] })).toEqual({
      packId: 'p',
      filter: { ids: ['a', 'b'] }
    });
    expect(
      toGetPackContentsQuery({ packId: 'p', types: [], ids: ['a'] })
    ).toEqual({ packId: 'p', filter: { types: [], ids: ['a'] } });
  });
});

describe('toSearchInPackQuery', () => {
  it('applies EQUALS and negate=false defaults to filters', () => {
    const query = toSearchInPackQuery({
      packId: 'p',
      filters: [{ field: 'type', value: 'spell' }]
    });
    expect(query.criteria.filters).toEqual([
      { field: 'type', operator: 'EQUALS', value: 'spell', negate: false }
    ]);
  });

  it('passes custom operator and negate through', () => {
    const query = toSearchInPackQuery({
      packId: 'p',
      filters: [{ field: 'system.level', operator: 'GREATER_THAN', value: 2, negate: true }]
    });
    expect(query.criteria.filters).toEqual([
      { field: 'system.level', operator: 'GREATER_THAN', value: 2, negate: true }
    ]);
  });

  it('omits absent optional criteria keys', () => {
    const query = toSearchInPackQuery({ packId: 'p' });
    expect(query.criteria).toEqual({});
    expect(query).not.toHaveProperty('limit');
    expect(query).not.toHaveProperty('offset');
  });

  it('carries query, exclude, fields, limit, and offset', () => {
    const query = toSearchInPackQuery({
      packId: 'p',
      query: 'fire',
      exclude: ['x'],
      fields: ['system.level'],
      limit: 10,
      offset: 5
    });
    expect(query).toEqual({
      packId: 'p',
      criteria: { query: 'fire', exclude: ['x'], fields: ['system.level'] },
      limit: 10,
      offset: 5
    });
  });
});

describe('toSearchJournalPagesQuery', () => {
  it('keeps only provided keys', () => {
    expect(toSearchJournalPagesQuery({ query: 'grapple' })).toEqual({ query: 'grapple' });
    expect(
      toSearchJournalPagesQuery({
        query: 'grapple',
        packIds: ['p'],
        pageTypes: ['rule'],
        searchContent: false,
        limit: 5
      })
    ).toEqual({
      query: 'grapple',
      packIds: ['p'],
      pageTypes: ['rule'],
      searchContent: false,
      limit: 5
    });
  });
});

describe('toSearchAcrossPacksQuery', () => {
  it('keeps only provided keys', () => {
    expect(toSearchAcrossPacksQuery({ query: 'gob' })).toEqual({ query: 'gob' });
    expect(
      toSearchAcrossPacksQuery({ query: 'gob', type: 'Actor', system: 's', limit: 5 })
    ).toEqual({ query: 'gob', type: 'Actor', system: 's', limit: 5 });
  });
});

describe('import command mappers', () => {
  it('maps actor import with optional overrides', () => {
    expect(toImportActorCommand({ packId: 'p', actorId: 'a' })).toEqual({
      packId: 'p',
      actorId: 'a'
    });
    expect(
      toImportActorCommand({ packId: 'p', actorId: 'a', name: 'N', folder: 'f' })
    ).toEqual({ packId: 'p', actorId: 'a', name: 'N', folder: 'f' });
  });

  it('maps add-item command with quantity', () => {
    expect(
      toAddItemToActorCommand({ actorId: 'a', packId: 'p', itemId: 'i', quantity: 4 })
    ).toEqual({ actorId: 'a', packId: 'p', itemId: 'i', quantity: 4 });
  });
});
