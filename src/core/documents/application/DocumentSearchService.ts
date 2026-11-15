import { CoreFeatureUnavailableError } from '@/core/shared';
import type { DocumentIndexReader, DocumentSearchQuery, DocumentSearchResult } from '@/core/documents/domain';

export interface DocumentSearchServiceDependencies {
  readonly index: DocumentIndexReader;
}

export class DocumentSearchService {
  constructor(private readonly deps: DocumentSearchServiceDependencies) {}

  async search(query: DocumentSearchQuery): Promise<DocumentSearchResult> {
    if (!this.deps.index.isAvailable()) {
      throw new CoreFeatureUnavailableError('The core document index is not available');
    }
    return { query: query.query, results: await this.deps.index.search(query) };
  }
}
