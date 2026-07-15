import {
  getCompendiumDocumentRequestSchema,
  getCompendiumIndexRequestSchema,
  getCompendiumRequestSchema,
  searchCompendiumPagesRequestSchema,
  searchCompendiumRequestSchema,
  searchCompendiumsRequestSchema
} from '../querySchemas';

describe('compendium query schemas', () => {
  it('getCompendium accepts a packId and strips unknown keys', () => {
    const parsed = getCompendiumRequestSchema.parse({ packId: 'p1', extra: true });
    expect(parsed).toEqual({ packId: 'p1' });
  });

  it('getCompendium rejects a missing packId', () => {
    expect(getCompendiumRequestSchema.safeParse({}).success).toBe(false);
  });

  it('getCompendium accepts optional types and ids selections', () => {
    expect(
      getCompendiumRequestSchema.parse({ packId: 'p', types: ['spell'], ids: ['a'] })
    ).toEqual({ packId: 'p', types: ['spell'], ids: ['a'] });
    expect(
      getCompendiumRequestSchema.safeParse({ packId: 'p', types: [5] }).success
    ).toBe(false);
  });

  it('getCompendiumIndex accepts optional fields array', () => {
    expect(
      getCompendiumIndexRequestSchema.parse({ packId: 'p', fields: ['system.level'] })
    ).toEqual({ packId: 'p', fields: ['system.level'] });
    expect(getCompendiumIndexRequestSchema.parse({ packId: 'p' })).toEqual({
      packId: 'p'
    });
  });

  it('searchCompendium accepts full criteria and tolerates out-of-range numbers', () => {
    const parsed = searchCompendiumRequestSchema.parse({
      packId: 'p',
      query: 'fire',
      filters: [{ field: 'type', operator: 'GREATER_THAN', value: 3, negate: true }],
      exclude: ['x'],
      fields: ['system.level'],
      limit: -5,
      offset: -1
    });
    expect(parsed.limit).toBe(-5);
    expect(parsed.offset).toBe(-1);
  });

  it('searchCompendium accepts filters without operator/negate/value', () => {
    const parsed = searchCompendiumRequestSchema.parse({
      packId: 'p',
      filters: [{ field: 'type' }]
    });
    expect(parsed.filters?.[0]).toEqual({ field: 'type' });
  });

  it('searchCompendium rejects an unknown operator literal', () => {
    const result = searchCompendiumRequestSchema.safeParse({
      packId: 'p',
      filters: [{ field: 'type', operator: 'LIKE' }]
    });
    expect(result.success).toBe(false);
  });

  it('searchCompendiums requires query and accepts optional filters', () => {
    expect(searchCompendiumsRequestSchema.safeParse({}).success).toBe(false);
    expect(
      searchCompendiumsRequestSchema.parse({
        query: 'gob',
        type: 'Actor',
        system: 'dnd5e',
        limit: 0
      })
    ).toEqual({ query: 'gob', type: 'Actor', system: 'dnd5e', limit: 0 });
  });

  it('searchCompendiumPages requires query and accepts optional filters', () => {
    expect(searchCompendiumPagesRequestSchema.safeParse({}).success).toBe(false);
    expect(
      searchCompendiumPagesRequestSchema.parse({
        query: 'grapple',
        packIds: ['dnd5e.rules'],
        pageTypes: ['rule'],
        searchContent: false,
        limit: 0
      })
    ).toEqual({
      query: 'grapple',
      packIds: ['dnd5e.rules'],
      pageTypes: ['rule'],
      searchContent: false,
      limit: 0
    });
  });

  it('getCompendiumDocument requires both ids', () => {
    expect(
      getCompendiumDocumentRequestSchema.safeParse({ packId: 'p' }).success
    ).toBe(false);
    expect(
      getCompendiumDocumentRequestSchema.parse({ packId: 'p', documentId: 'd' })
    ).toEqual({ packId: 'p', documentId: 'd' });
  });
});
