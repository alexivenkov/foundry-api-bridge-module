import type {
  ActorInventory,
  ActorRef,
  CreatedActorView,
  CreatedItemView,
  EmbeddedItemRecord,
  ImportedWorldDocument,
  PackCatalog,
  PackDescriptor,
  PackDocumentReader,
  PackDocumentRecord,
  PackDocumentView,
  PackIndexEntry,
  PackIndexReader,
  PackIndexScanner,
  PackSearchEngine,
  PackSummary,
  ScannablePack,
  WorldImporter
} from '../../domain';
import { PackDocumentNotFoundError, PackNotFoundError } from '../../domain';

export function descriptor(overrides: Partial<PackDescriptor> = {}): PackDescriptor {
  return { id: 'p1', label: 'Pack One', type: 'Item', system: 'dnd5e', ...overrides };
}

export function summary(overrides: Partial<PackSummary> = {}): PackSummary {
  return { ...descriptor(), packageName: 'world', documentCount: 1, ...overrides };
}

export function entry(overrides: Partial<PackIndexEntry> = {}): PackIndexEntry {
  return { id: 'e1', name: 'Entry', img: null, type: null, ...overrides };
}

export class FakeCatalog implements PackCatalog {
  constructor(
    private readonly packs: readonly PackDescriptor[] = [],
    private readonly summaries: readonly PackSummary[] = []
  ) {}

  listPacks(): readonly PackSummary[] {
    return this.summaries;
  }

  findPack(packId: string): PackDescriptor | null {
    return this.packs.find(p => p.id === packId) ?? null;
  }
}

export class FakeIndexReader implements PackIndexReader {
  readonly calls: Array<{ packId: string; fields?: readonly string[] | undefined }> = [];

  constructor(private readonly entries: readonly PackIndexEntry[] = []) {}

  readIndex(
    packId: string,
    fields?: readonly string[]
  ): Promise<readonly PackIndexEntry[]> {
    this.calls.push({ packId, fields });
    return Promise.resolve(this.entries);
  }
}

export class FakeScanner implements PackIndexScanner {
  constructor(
    private readonly packs: ReadonlyArray<{
      descriptor: PackDescriptor;
      entries: readonly PackIndexEntry[];
    }>
  ) {}

  readonly readCounts = new Map<string, number>();

  scanPacks(): readonly ScannablePack[] {
    return this.packs.map(({ descriptor: desc, entries: packEntries }) => ({
      descriptor: desc,
      readEntries: (): Promise<readonly PackIndexEntry[]> => {
        this.readCounts.set(desc.id, (this.readCounts.get(desc.id) ?? 0) + 1);
        return Promise.resolve(packEntries);
      }
    }));
  }
}

export class FakeSearchEngine implements PackSearchEngine {
  readonly calls: Array<{ packId: string; criteria: unknown }> = [];

  constructor(private readonly results: readonly PackIndexEntry[] = []) {}

  searchIndex(packId: string, criteria: unknown): Promise<readonly PackIndexEntry[]> {
    this.calls.push({ packId, criteria });
    if (packId === 'missing') {
      return Promise.reject(new PackNotFoundError(packId));
    }
    return Promise.resolve(this.results);
  }
}

export class FakeDocumentReader implements PackDocumentReader {
  views: readonly PackDocumentView[] = [];
  record: PackDocumentRecord | null = null;
  source: Record<string, unknown> | null = null;

  readAllDocumentViews(_packId: string): Promise<readonly PackDocumentView[]> {
    return Promise.resolve(this.views);
  }

  readDocumentRecord(packId: string, documentId: string): Promise<PackDocumentRecord> {
    if (this.record === null) {
      return Promise.reject(new PackDocumentNotFoundError(packId, documentId));
    }
    return Promise.resolve(this.record);
  }

  readDocumentSource(
    packId: string,
    documentId: string
  ): Promise<Record<string, unknown>> {
    if (this.source === null) {
      return Promise.reject(new PackDocumentNotFoundError(packId, documentId));
    }
    return Promise.resolve(this.source);
  }
}

export class FakeWorldImporter implements WorldImporter {
  importedType: string | null = null;
  importedData: Record<string, unknown> | null = null;
  importResult: ImportedWorldDocument | null = {
    id: 'w1',
    uuid: 'Actor.w1',
    name: 'Imported'
  };

  actorData: Record<string, unknown> | null = null;
  itemData: Record<string, unknown> | null = null;

  createByDocumentType(
    documentType: string,
    data: Record<string, unknown>
  ): Promise<ImportedWorldDocument | null> {
    this.importedType = documentType;
    this.importedData = data;
    return Promise.resolve(this.importResult);
  }

  createActor(data: Record<string, unknown>): Promise<CreatedActorView> {
    this.actorData = data;
    return Promise.resolve({
      id: 'a1',
      uuid: 'Actor.a1',
      name: 'Hero',
      type: 'npc',
      img: 'a.png',
      folderName: null
    });
  }

  createItem(data: Record<string, unknown>): Promise<CreatedItemView> {
    this.itemData = data;
    return Promise.resolve({
      id: 'i1',
      uuid: 'Item.i1',
      name: 'Sword',
      type: 'weapon',
      img: 'i.png',
      folderName: null
    });
  }
}

export class FakeActorInventory implements ActorInventory {
  actor: ActorRef | null = { id: 'actor1', name: 'Hero' };
  created: EmbeddedItemRecord | null = {
    id: 'emb1',
    name: 'Sword',
    type: 'weapon',
    img: 's.png'
  };
  lastItemData: Record<string, unknown> | null = null;

  findActor(_actorId: string): ActorRef | null {
    return this.actor;
  }

  createEmbeddedItem(
    _actorId: string,
    itemData: Record<string, unknown>
  ): Promise<EmbeddedItemRecord | null> {
    this.lastItemData = itemData;
    return Promise.resolve(this.created);
  }
}
