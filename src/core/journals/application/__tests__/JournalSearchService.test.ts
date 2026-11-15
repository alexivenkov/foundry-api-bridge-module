import { JournalSearchService } from '../JournalSearchService';
import { FakeJournalStore, journal, page } from './fakePorts';

describe('JournalSearchService', () => {
  const store = new FakeJournalStore([
    journal({
      id: 'j1',
      name: 'Quest Log',
      pages: Array.from({ length: 30 }, (_, index) => page({ id: `p${String(index)}`, name: `Goblin ${String(index)}` }))
    })
  ]);

  it('searches the world journals with content search on, 25 matches from the start', () => {
    const outcome = new JournalSearchService({ journals: store }).search({ query: 'goblin' });

    expect(outcome.matches).toHaveLength(25);
    expect(outcome.matches[0]?.pageId).toBe('p0');
    expect(outcome.hasMore).toBe(true);
  });

  it('passes the limit, offset, page types and content switch on', () => {
    const service = new JournalSearchService({ journals: store });

    expect(service.search({ query: 'goblin', limit: 5, offset: 28 })).toMatchObject({ hasMore: false });
    expect(service.search({ query: 'hello', searchContent: false }).matches).toEqual([]);
    expect(service.search({ query: 'hello' }).matches).toHaveLength(25);
    expect(service.search({ query: 'goblin', pageTypes: ['image'] }).matches).toEqual([]);
  });
});
