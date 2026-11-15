import type {
  DocumentExporter,
  DocumentFlagStore,
  DocumentImporter,
  DocumentIndexReader,
  DocumentOwnershipStore,
  DocumentReference,
  DocumentSearchHit,
  DocumentSearchQuery,
  DocumentSortStore,
  FlaggedDocument,
  ImportFolder,
  ImportedDocument,
  OwnedDocument,
  OwnershipLevels,
  ScriptContentKind,
  ScriptContentPolicy,
  SortPosition,
  SortableDocument,
  TransferableDocumentType
} from '../../domain';

export function ref(overrides: Partial<DocumentReference> = {}): DocumentReference {
  return {
    uuid: 'Actor.a1',
    documentType: 'Actor',
    id: 'a1',
    name: 'Goblin',
    packId: null,
    parentUuid: null,
    ...overrides
  };
}

export class FakeOwnershipStore implements DocumentOwnershipStore {
  readonly replaced: Array<{ uuid: string; ownership: OwnershipLevels }> = [];
  losesDocumentOnWrite = false;
  private readonly documents = new Map<string, OwnedDocument>();

  constructor(
    documents: readonly OwnedDocument[],
    private readonly users: Readonly<Record<string, string>> = {}
  ) {
    for (const document of documents) {
      this.documents.set(document.document.uuid, document);
    }
  }

  findDocument(uuid: string): Promise<OwnedDocument | null> {
    return Promise.resolve(this.documents.get(uuid) ?? null);
  }

  userName(userId: string): string | null {
    return this.users[userId] ?? null;
  }

  replaceOwnership(uuid: string, ownership: OwnershipLevels): Promise<OwnedDocument | null> {
    this.replaced.push({ uuid, ownership });
    const current = this.documents.get(uuid);
    if (current === undefined || this.losesDocumentOnWrite) {
      return Promise.resolve(null);
    }
    const updated = { document: current.document, ownership };
    this.documents.set(uuid, updated);
    return Promise.resolve(updated);
  }
}

export class FakeFlagStore implements DocumentFlagStore {
  readonly setCalls: Array<{ uuid: string; scope: string; key: string; value: unknown }> = [];
  readonly unsetCalls: Array<{ uuid: string; scope: string; key: string }> = [];
  losesDocumentOnWrite = false;
  private readonly documents = new Map<string, FlaggedDocument>();

  constructor(
    documents: readonly FlaggedDocument[],
    private readonly scopes: readonly string[] = ['core', 'world', 'dnd5e']
  ) {
    for (const document of documents) {
      this.documents.set(document.document.uuid, document);
    }
  }

  findDocument(uuid: string): Promise<FlaggedDocument | null> {
    return Promise.resolve(this.documents.get(uuid) ?? null);
  }

  activeScopes(): readonly string[] {
    return this.scopes;
  }

  setFlag(uuid: string, scope: string, key: string, value: unknown): Promise<FlaggedDocument | null> {
    this.setCalls.push({ uuid, scope, key, value });
    const current = this.documents.get(uuid);
    if (current === undefined || this.losesDocumentOnWrite) {
      return Promise.resolve(null);
    }
    const scoped = { ...((current.flags?.[scope] as Record<string, unknown> | undefined) ?? {}), [key]: value };
    const updated = { document: current.document, flags: { ...current.flags, [scope]: scoped } };
    this.documents.set(uuid, updated);
    return Promise.resolve(updated);
  }

  unsetFlag(uuid: string, scope: string, key: string): Promise<FlaggedDocument | null> {
    this.unsetCalls.push({ uuid, scope, key });
    const current = this.documents.get(uuid);
    return Promise.resolve(current === undefined || this.losesDocumentOnWrite ? null : current);
  }
}

export class FakeSortStore implements DocumentSortStore {
  readonly sorted: Array<{ uuid: string; targetUuid: string; position: SortPosition }> = [];
  losesDocumentOnWrite = false;
  private readonly documents = new Map<string, SortableDocument>();

  constructor(documents: readonly SortableDocument[]) {
    for (const document of documents) {
      this.documents.set(document.document.uuid, document);
    }
  }

  findDocument(uuid: string): Promise<SortableDocument | null> {
    return Promise.resolve(this.documents.get(uuid) ?? null);
  }

  sortRelative(uuid: string, targetUuid: string, position: SortPosition): Promise<SortableDocument | null> {
    this.sorted.push({ uuid, targetUuid, position });
    const current = this.documents.get(uuid);
    if (current === undefined || this.losesDocumentOnWrite) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, sort: 150000 });
  }
}

export class FakeIndexReader implements DocumentIndexReader {
  readonly queries: DocumentSearchQuery[] = [];

  constructor(
    private readonly hits: readonly DocumentSearchHit[],
    private readonly available = true
  ) {}

  isAvailable(): boolean {
    return this.available;
  }

  search(query: DocumentSearchQuery): Promise<readonly DocumentSearchHit[]> {
    this.queries.push(query);
    return Promise.resolve(this.hits);
  }
}

export class FakeExporter implements DocumentExporter {
  readonly exported: string[] = [];
  data: Record<string, unknown> | null = { name: 'Goblin', type: 'npc' };

  constructor(private readonly documents: readonly DocumentReference[]) {}

  findDocument(uuid: string): Promise<DocumentReference | null> {
    return Promise.resolve(this.documents.find((document) => document.uuid === uuid) ?? null);
  }

  exportDocument(uuid: string): Promise<Readonly<Record<string, unknown>> | null> {
    this.exported.push(uuid);
    return Promise.resolve(this.data);
  }
}

export class FakeImporter implements DocumentImporter {
  readonly imported: Array<{ documentType: TransferableDocumentType; data: unknown; folderId: string | null }> = [];
  scriptContent: ScriptContentKind[] = [];
  createsNothing = false;

  constructor(private readonly folders: readonly ImportFolder[] = []) {}

  findFolder(folderId: string): ImportFolder | null {
    return this.folders.find((folder) => folder.id === folderId) ?? null;
  }

  findScriptContent(): Promise<readonly ScriptContentKind[]> {
    return Promise.resolve(this.scriptContent);
  }

  importDocument(
    documentType: TransferableDocumentType,
    data: Readonly<Record<string, unknown>>,
    folderId: string | null
  ): Promise<ImportedDocument | null> {
    this.imported.push({ documentType, data, folderId });
    if (this.createsNothing) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      document: ref({ uuid: `${documentType}.new1`, documentType, id: 'new1', name: String(data['name'] ?? '') }),
      folderId
    });
  }
}

export function scriptPolicy(allows: boolean): ScriptContentPolicy {
  return { allowsScripts: () => allows };
}
