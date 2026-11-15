import type { DocumentSortStore, SortPosition, SortableDocument } from '@/core/documents/domain';
import { sourceString, toDocumentReference } from './documentMapper';
import { FoundryDocumentResolver } from './FoundryDocumentResolver';
import type { DocumentGlobalsProvider, FoundryDocument } from './foundryDocumentTypes';

/**
 * The set of siblings a document is sorted among, as the sidebar and the sheets see it: the embedded documents of the
 * same parent, the folders of the same type under the same parent folder, the documents of a world collection (or a
 * pack) in the same folder. Null for a type without `sort`.
 */
function containerOf(document: FoundryDocument): string | null {
  if (!document.schema.has('sort')) {
    return null;
  }
  const folder = sourceString(document, 'folder') ?? '';
  const parent = document.parent ?? null;
  if (parent !== null) {
    return `parent:${parent.uuid}:${document.documentName}`;
  }
  if (typeof document.pack === 'string') {
    return `pack:${document.pack}:${document.documentName}:${folder}`;
  }
  if (document.documentName === 'Folder') {
    return `folder:${sourceString(document, 'type') ?? ''}:${folder}`;
  }
  return `world:${document.documentName}:${folder}`;
}

function toSortable(document: FoundryDocument): SortableDocument {
  const sort = document._source['sort'];
  return {
    document: toDocumentReference(document),
    sort: typeof sort === 'number' ? sort : 0,
    container: containerOf(document)
  };
}

/** Anti-corruption layer over `ClientDocumentMixin#sortRelative` (`foundry.utils.performIntegerSort`). */
export class FoundryDocumentSortStore implements DocumentSortStore {
  private readonly resolver: FoundryDocumentResolver;

  constructor(private readonly globals: DocumentGlobalsProvider) {
    this.resolver = new FoundryDocumentResolver(globals);
  }

  async findDocument(uuid: string): Promise<SortableDocument | null> {
    const document = await this.resolver.resolve(uuid);
    return document !== null ? toSortable(document) : null;
  }

  async sortRelative(uuid: string, targetUuid: string, position: SortPosition): Promise<SortableDocument | null> {
    const document = await this.resolver.resolve(uuid);
    const target = await this.resolver.resolve(targetUuid);
    if (document === null || target === null) {
      return null;
    }
    const siblings = this.siblingsOf(document);
    // performIntegerSort finds the target by identity among the siblings.
    const targetSibling = siblings.find((sibling) => sibling.uuid === target.uuid) ?? target;
    await document.sortRelative({ target: targetSibling, siblings, sortKey: 'sort', sortBefore: position === 'before' });
    return toSortable(document);
  }

  private siblingsOf(document: FoundryDocument): FoundryDocument[] {
    const container = containerOf(document);
    const { game } = this.globals();
    const parent = document.parent ?? null;
    let candidates: readonly FoundryDocument[];
    if (parent !== null) {
      candidates = parent.getEmbeddedCollection?.(document.documentName).contents ?? [];
    } else if (document.documentName === 'Folder') {
      candidates = game.folders.contents;
    } else {
      candidates = game.collections.get(document.documentName)?.contents ?? [];
    }
    return candidates.filter((candidate) => candidate.uuid !== document.uuid && containerOf(candidate) === container);
  }
}
