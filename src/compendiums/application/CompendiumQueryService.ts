import {
  CrossPackSearchLimit,
  NameNeedle,
  PackNotFoundError,
  PackTypeMismatchError,
  PageOffset,
  PageSearchLimit,
  SearchInPackLimit,
  journalPageUuid,
  matchJournalPage
} from '@/compendiums/domain';
import type {
  CrossPackMatch,
  JournalPageMatch,
  PackCatalog,
  PackDescriptor,
  PackDocumentReader,
  PackIndexReader,
  PackIndexScanner,
  PackSearchEngine,
  PackSummary
} from '@/compendiums/domain';
import type {
  GetPackContentsQuery,
  GetPackDocumentQuery,
  GetPackIndexQuery,
  SearchAcrossPacksQuery,
  SearchInPackQuery,
  SearchJournalPagesQuery
} from './queries';
import type {
  PackContentsResult,
  PackDocumentResult,
  PackIndexResult,
  PackSearchResult
} from './results';

export interface CompendiumQueryServiceDependencies {
  readonly catalog: PackCatalog;
  readonly indexReader: PackIndexReader;
  readonly indexScanner: PackIndexScanner;
  readonly searchEngine: PackSearchEngine;
  readonly documentReader: PackDocumentReader;
}

export class CompendiumQueryService {
  constructor(private readonly deps: CompendiumQueryServiceDependencies) {}

  listPacks(): readonly PackSummary[] {
    return this.deps.catalog.listPacks();
  }

  async getPackContents(query: GetPackContentsQuery): Promise<PackContentsResult> {
    const pack = this.requirePack(query.packId);
    const documents = await this.deps.documentReader.readAllDocumentViews(
      query.packId,
      query.filter
    );
    return { pack, documentCount: documents.length, documents };
  }

  async getIndex(query: GetPackIndexQuery): Promise<PackIndexResult> {
    const pack = this.requirePack(query.packId);
    const entries = await this.deps.indexReader.readIndex(query.packId, query.fields);
    return { pack, total: entries.length, entries };
  }

  async searchInPack(query: SearchInPackQuery): Promise<PackSearchResult> {
    const matched = await this.deps.searchEngine.searchIndex(query.packId, query.criteria);

    const total = matched.length;
    const limit = SearchInPackLimit.resolve(query.limit);
    const offset = PageOffset.resolve(query.offset);
    const page = matched.slice(offset, offset + limit);

    return {
      packId: query.packId,
      results: page,
      total,
      hasMore: offset + page.length < total
    };
  }

  async searchAcrossPacks(query: SearchAcrossPacksQuery): Promise<readonly CrossPackMatch[]> {
    const needle = new NameNeedle(query.query);
    if (needle.isEmpty) {
      return [];
    }

    const limit = CrossPackSearchLimit.resolve(query.limit);
    const results: CrossPackMatch[] = [];

    for (const scanned of this.deps.indexScanner.scanPacks()) {
      const { descriptor } = scanned;
      if (query.type !== undefined && descriptor.type !== query.type) {
        continue;
      }
      if (query.system !== undefined && descriptor.system !== query.system) {
        continue;
      }

      const entries = await scanned.readEntries();
      for (const entry of entries) {
        if (!needle.matches(entry.name)) {
          continue;
        }
        if (entry.id === '') {
          continue;
        }

        const match: CrossPackMatch = {
          packId: descriptor.id,
          packLabel: descriptor.label,
          packType: descriptor.type,
          system: descriptor.system,
          id: entry.id,
          name: entry.name,
          ...(entry.type !== null && entry.type !== ''
            ? { documentType: entry.type }
            : {})
        };

        results.push(match);
        if (results.length >= limit) {
          return results;
        }
      }
    }

    return results;
  }

  async getDocument(query: GetPackDocumentQuery): Promise<PackDocumentResult> {
    const pack = this.requirePack(query.packId);
    const record = await this.deps.documentReader.readDocumentRecord(
      query.packId,
      query.documentId
    );
    return { record, documentType: pack.type };
  }

  // Scans journal packs lazily (a full search stops loading further packs
  // once the limit is reached). A page-name match wins over a content match.
  async searchJournalPages(
    query: SearchJournalPagesQuery
  ): Promise<readonly JournalPageMatch[]> {
    const needle = new NameNeedle(query.query);
    if (needle.isEmpty) {
      return [];
    }

    const limit = PageSearchLimit.resolve(query.limit);
    const searchContent = query.searchContent ?? true;
    const packs = this.resolveJournalPacks(query.packIds);

    const matches: JournalPageMatch[] = [];
    for (const pack of packs) {
      const journals = await this.deps.documentReader.readAllDocumentViews(pack.id);
      for (const journal of journals) {
        for (const page of journal.pages ?? []) {
          if (query.pageTypes !== undefined && !query.pageTypes.includes(page.type)) {
            continue;
          }

          const outcome = matchJournalPage(needle, page, searchContent);
          if (outcome === null) {
            continue;
          }

          matches.push({
            packId: pack.id,
            packLabel: pack.label,
            journalId: journal.id,
            journalName: journal.name,
            pageId: page.id,
            pageName: page.name,
            pageType: page.type,
            uuid: journalPageUuid(journal.uuid, page.id),
            matchedIn: outcome.matchedIn,
            snippet: outcome.snippet
          });
          if (matches.length >= limit) {
            return matches;
          }
        }
      }
    }
    return matches;
  }

  private resolveJournalPacks(packIds?: readonly string[]): PackDescriptor[] {
    if (packIds !== undefined) {
      return packIds.map(packId => {
        const pack = this.deps.catalog.findPack(packId);
        if (pack === null) {
          throw new PackNotFoundError(packId);
        }
        if (pack.type !== 'JournalEntry') {
          throw new PackTypeMismatchError(packId, 'JournalEntry', pack.type);
        }
        return pack;
      });
    }
    return this.deps.catalog.listPacks().filter(pack => pack.type === 'JournalEntry');
  }

  private requirePack(packId: string): PackDescriptor {
    const pack = this.deps.catalog.findPack(packId);
    if (pack === null) {
      throw new PackNotFoundError(packId);
    }
    return pack;
  }
}
