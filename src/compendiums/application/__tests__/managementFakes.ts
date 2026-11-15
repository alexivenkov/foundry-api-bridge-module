import type {
  AdventureGateway,
  AdventureHeader,
  AdventureImportOutcome,
  AdventureImportPlan,
  AdventureImportRequest,
  FolderExportOptions,
  FolderExportOutcome,
  PackConfigurationChange,
  PackContentWriter,
  PackDocumentChanges,
  PackDocumentPlacement,
  PackDocumentRef,
  PackFolderImportOutcome,
  PackFolderImportPlan,
  PackImportOptions,
  PackImportOutcome,
  PackInfo,
  PackManager,
  WorldBulkImporter,
  WorldDirectory,
  WorldDocumentExport,
  WorldDocumentRef,
  WorldFolderRef,
  WorldPackDraft
} from '../../domain';

export function packInfo(overrides: Partial<PackInfo> = {}): PackInfo {
  return {
    id: 'world.monsters',
    label: 'Monsters',
    type: 'Actor',
    system: 'dnd5e',
    packageType: 'world',
    packageName: 'my-world',
    locked: false,
    ownership: { player: 'observer', trusted: 'inherit', assistant: 'owner' },
    folderId: null,
    documentCount: 2,
    folders: [],
    ...overrides
  };
}

export function documentRef(overrides: Partial<PackDocumentRef> = {}): PackDocumentRef {
  return {
    id: 'd1',
    uuid: 'Compendium.world.monsters.Actor.d1',
    name: 'Goblin',
    type: 'npc',
    img: null,
    folderId: null,
    ...overrides
  };
}

export class FakePackManager implements PackManager {
  readonly packs = new Map<string, PackInfo>();
  types: readonly string[] = ['Actor', 'Adventure', 'Item', 'JournalEntry', 'Scene'];
  readonly created: WorldPackDraft[] = [];
  readonly duplicated: { packId: string; label: string }[] = [];
  readonly deleted: string[] = [];
  readonly configured: { packId: string; change: PackConfigurationChange }[] = [];
  createResult: string | null = 'world.new-pack';

  constructor(...infos: PackInfo[]) {
    for (const info of infos) this.packs.set(info.id, info);
  }

  supportedDocumentTypes(): readonly string[] {
    return this.types;
  }

  readPackInfo(packId: string): PackInfo | null {
    return this.packs.get(packId) ?? null;
  }

  plannedWorldPackId(label: string): string {
    return `world.${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  }

  createWorldPack(draft: WorldPackDraft): Promise<string | null> {
    this.created.push(draft);
    if (this.createResult !== null) {
      this.packs.set(this.createResult, packInfo({ id: this.createResult, label: draft.label, type: draft.documentType }));
    }
    return Promise.resolve(this.createResult);
  }

  duplicatePack(packId: string, label: string): Promise<string | null> {
    this.duplicated.push({ packId, label });
    if (this.createResult !== null) {
      this.packs.set(this.createResult, packInfo({ id: this.createResult, label }));
    }
    return Promise.resolve(this.createResult);
  }

  deleteWorldPack(packId: string): Promise<void> {
    this.deleted.push(packId);
    this.packs.delete(packId);
    return Promise.resolve();
  }

  configurePack(packId: string, change: PackConfigurationChange): Promise<void> {
    this.configured.push({ packId, change });
    const current = this.packs.get(packId);
    if (current) {
      this.packs.set(packId, {
        ...current,
        ...(change.locked !== undefined ? { locked: change.locked } : {}),
        ...(change.ownership ? { ownership: change.ownership } : {}),
        ...(change.folderId !== undefined ? { folderId: change.folderId } : {})
      });
    }
    return Promise.resolve();
  }
}

export class FakeWorldDirectory implements WorldDirectory {
  readonly folders = new Map<string, WorldFolderRef>();
  readonly documents = new Map<string, WorldDocumentRef>();

  addFolder(id: string, type: string): this {
    this.folders.set(id, { id, name: `Folder ${id}`, type });
    return this;
  }

  addDocument(documentType: string, id: string, name = id): this {
    this.documents.set(`${documentType}.${id}`, { id, name });
    return this;
  }

  findFolder(folderId: string): WorldFolderRef | null {
    return this.folders.get(folderId) ?? null;
  }

  findDocument(documentType: string, documentId: string): WorldDocumentRef | null {
    return this.documents.get(`${documentType}.${documentId}`) ?? null;
  }

  existingDocumentIds(documentType: string, documentIds: readonly string[]): readonly string[] {
    return documentIds.filter(id => this.documents.has(`${documentType}.${id}`));
  }
}

export class FakePackContentWriter implements PackContentWriter {
  readonly documents = new Map<string, PackDocumentRef>();
  readonly exports: { packId: string; request: WorldDocumentExport }[] = [];
  readonly folderExports: { packId: string; folderId: string; options: FolderExportOptions }[] = [];
  readonly updates: { packId: string; documentId: string; changes: PackDocumentChanges }[] = [];
  readonly deletions: { packId: string; documentId: string }[] = [];
  exportResult: PackDocumentRef | null = documentRef({ id: 'new1' });
  folderOutcome: FolderExportOutcome | null = { exportedCount: 3, createdCount: 2, updatedCount: 1, documentCount: 5 };

  findDocument(packId: string, documentId: string): Promise<PackDocumentRef | null> {
    return Promise.resolve(this.documents.get(`${packId}/${documentId}`) ?? null);
  }

  exportWorldDocument(packId: string, request: WorldDocumentExport): Promise<PackDocumentRef | null> {
    this.exports.push({ packId, request });
    return Promise.resolve(this.exportResult);
  }

  exportWorldFolder(packId: string, folderId: string, options: FolderExportOptions): Promise<FolderExportOutcome | null> {
    this.folderExports.push({ packId, folderId, options });
    return Promise.resolve(this.folderOutcome);
  }

  updateDocument(packId: string, documentId: string, changes: PackDocumentChanges): Promise<PackDocumentRef> {
    this.updates.push({ packId, documentId, changes });
    return Promise.resolve(documentRef({ id: documentId, name: changes.name ?? 'Goblin' }));
  }

  deleteDocument(packId: string, documentId: string): Promise<void> {
    this.deletions.push({ packId, documentId });
    return Promise.resolve();
  }
}

export class FakeBulkImporter implements WorldBulkImporter {
  placements: PackDocumentPlacement[] = [];
  readonly packImports: { packId: string; options: PackImportOptions }[] = [];
  readonly folderImports: { packId: string; plan: PackFolderImportPlan }[] = [];

  readDocumentPlacements(): Promise<readonly PackDocumentPlacement[]> {
    return Promise.resolve(this.placements);
  }

  importPack(packId: string, options: PackImportOptions): Promise<PackImportOutcome> {
    this.packImports.push({ packId, options });
    return Promise.resolve({ folder: { id: 'wf1', name: 'Monsters' }, documents: [{ id: 'a1', name: 'Goblin' }] });
  }

  importPackFolder(packId: string, plan: PackFolderImportPlan): Promise<PackFolderImportOutcome> {
    this.folderImports.push({ packId, plan });
    return Promise.resolve({
      folder: { id: plan.folderIds[0] ?? '', name: 'Undead' },
      createdFolderCount: plan.folderIds.length,
      documents: plan.documentIds.map(id => ({ id, name: id }))
    });
  }
}

export class FakeAdventureGateway implements AdventureGateway {
  available = true;
  types: readonly string[] = ['Actor', 'Combat', 'Item', 'JournalEntry', 'Scene', 'RollTable', 'Macro', 'Cards', 'Playlist', 'Folder'];
  header: AdventureHeader | null = {
    id: 'adv1',
    uuid: 'Compendium.world.adventures.Adventure.adv1',
    name: 'Lost Mine',
    img: null,
    caption: '',
    description: '<p>Intro</p>',
    imported: false
  };
  plan: AdventureImportPlan = {
    toCreate: [{ documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] }],
    toUpdate: []
  };
  outcome: AdventureImportOutcome | null = {
    created: [{ documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] }],
    updated: []
  };
  readonly plans: (readonly string[] | undefined)[] = [];
  readonly imports: AdventureImportRequest[] = [];

  isAvailable(): boolean {
    return this.available;
  }

  contentTypes(): readonly string[] {
    return this.types;
  }

  readAdventure(): Promise<AdventureHeader | null> {
    return Promise.resolve(this.header);
  }

  planImport(_packId: string, _adventureId: string, documentTypes?: readonly string[]): Promise<AdventureImportPlan> {
    this.plans.push(documentTypes);
    return Promise.resolve(this.plan);
  }

  importAdventure(_packId: string, _adventureId: string, request: AdventureImportRequest): Promise<AdventureImportOutcome | null> {
    this.imports.push(request);
    return Promise.resolve(this.outcome);
  }
}
