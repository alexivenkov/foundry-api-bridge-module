import { foundryGeneration } from '@/compat/foundryVersion';
import { PackDocumentNotFoundError, PackNotFoundError } from '@/compendiums/domain';
import type {
  PackContentsFilter,
  PackDocumentReader,
  PackDocumentRecord,
  PackDocumentView
} from '@/compendiums/domain';
import { toPackDocumentView } from './documentViewMapper';
import type { CompendiumGameProvider } from './foundryGameProvider';
import type { FoundryPack, FoundryPackDocument } from './foundryPackTypes';

// `__in` database query operators are verified on v13/v14 cores; older
// generations fall back to a full load with client-side filtering.
const SERVER_QUERY_MIN_GENERATION = 13;

export class FoundryPackDocumentReader implements PackDocumentReader {
  constructor(private readonly gameProvider: CompendiumGameProvider) {}

  async readAllDocumentViews(
    packId: string,
    filter?: PackContentsFilter
  ): Promise<readonly PackDocumentView[]> {
    const pack = this.requirePack(packId);

    const serverQuery = buildServerQuery(filter);
    if (serverQuery !== undefined && foundryGeneration() >= SERVER_QUERY_MIN_GENERATION) {
      const rawDocuments = await pack.getDocuments(serverQuery);
      return rawDocuments.map(toView);
    }

    const rawDocuments = await pack.getDocuments();
    const views = rawDocuments.map(toView);
    return filter !== undefined ? applyFilterClientSide(views, filter) : views;
  }

  async readDocumentRecord(
    packId: string,
    documentId: string
  ): Promise<PackDocumentRecord> {
    const doc = await this.requireDocument(packId, documentId);
    return {
      id: doc.id,
      uuid: doc.uuid,
      name: doc.name,
      type: doc.type ?? '',
      img: doc.img !== undefined && doc.img !== null ? doc.img : null,
      data: doc.toObject()
    };
  }

  async readDocumentSource(
    packId: string,
    documentId: string
  ): Promise<Record<string, unknown>> {
    const doc = await this.requireDocument(packId, documentId);
    return doc.toObject();
  }

  private requirePack(packId: string): FoundryPack {
    const pack = this.gameProvider.getGame().packs?.get(packId);
    if (!pack) {
      throw new PackNotFoundError(packId);
    }
    return pack;
  }

  private async requireDocument(
    packId: string,
    documentId: string
  ): Promise<FoundryPackDocument> {
    const pack = this.requirePack(packId);
    const doc = await pack.getDocument(documentId);
    if (!doc) {
      throw new PackDocumentNotFoundError(packId, documentId);
    }
    return doc;
  }
}

function toView(doc: FoundryPackDocument): PackDocumentView {
  return toPackDocumentView(doc as unknown as Record<string, unknown>);
}

function buildServerQuery(
  filter: PackContentsFilter | undefined
): Record<string, unknown> | undefined {
  if (filter === undefined) {
    return undefined;
  }
  const query: Record<string, unknown> = {};
  if (filter.types !== undefined) {
    query['type__in'] = [...filter.types];
  }
  if (filter.ids !== undefined) {
    query['_id__in'] = [...filter.ids];
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

// Mirrors the server's `__in` semantics: an empty list matches nothing,
// an absent field applies no constraint.
function applyFilterClientSide(
  views: readonly PackDocumentView[],
  filter: PackContentsFilter
): readonly PackDocumentView[] {
  return views.filter(view => {
    if (filter.types !== undefined && !filter.types.includes(view.type)) {
      return false;
    }
    if (filter.ids !== undefined && !filter.ids.includes(view.id)) {
      return false;
    }
    return true;
  });
}
