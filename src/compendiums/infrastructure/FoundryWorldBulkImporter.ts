import { foundryGeneration } from '@/compat/foundryVersion';
import {
  ImportFolderCreationFailedError,
  MACRO_DOCUMENT_TYPE,
  PackNotFoundError,
  WorldDocumentClassUnavailableError
} from '@/compendiums/domain';
import type {
  PackDocumentPlacement,
  PackFolderImportOutcome,
  PackFolderImportPlan,
  PackImportOptions,
  PackImportOutcome,
  WorldBulkImporter,
  WorldDocumentRef
} from '@/compendiums/domain';
import type {
  FoundryCreatedWorldDocument,
  FoundryFolderClass,
  FoundryManagedPack,
  FoundryManagementGame,
  FoundryPackDocumentLike,
  FoundryWorldCollection,
  FoundryWorldFolder,
  PackManagementGameProvider,
  PackManagementGlobals
} from './foundryPackManagementTypes';

// The chunk size `CompendiumCollection#importAll` creates world documents in.
const CREATE_CHUNK_SIZE = 100;
const SERVER_QUERY_MIN_GENERATION = 13;
// `BaseMacro#type`; the Macro index lacks it unless asked for (`compendiumIndexFields`, Foundry 13.351 / 14.368).
const SCRIPT_MACRO_TYPE = 'script';

export class FoundryWorldBulkImporter implements WorldBulkImporter {
  constructor(
    private readonly gameProvider: PackManagementGameProvider,
    private readonly globals: PackManagementGlobals,
    private readonly generation: () => number = foundryGeneration
  ) {}

  async readDocumentPlacements(packId: string): Promise<readonly PackDocumentPlacement[]> {
    const index = await this.requirePack(this.gameProvider.getGame(), packId).getIndex({ fields: ['folder'] });
    const placements: PackDocumentPlacement[] = [];
    index.forEach(entry => placements.push({ id: entry._id, folderId: entry.folder ?? null }));
    return placements;
  }

  async listScriptMacros(packId: string): Promise<readonly WorldDocumentRef[]> {
    const pack = this.requirePack(this.gameProvider.getGame(), packId);
    if (pack.metadata.type !== MACRO_DOCUMENT_TYPE) return [];
    const index = await pack.getIndex({ fields: ['type'] });
    const macros: WorldDocumentRef[] = [];
    index.forEach(entry => {
      if (entry.type === SCRIPT_MACRO_TYPE) macros.push({ id: entry._id, name: entry.name ?? '' });
    });
    return macros;
  }

  async importPack(packId: string, options: PackImportOptions): Promise<PackImportOutcome> {
    const game = this.gameProvider.getGame();
    const pack = this.requirePack(game, packId);
    if (options.skipDocumentIds !== undefined && options.skipDocumentIds.length > 0) {
      return this.importPackWithout(game, pack, options, new Set(options.skipDocumentIds));
    }
    const knownFolderIds = new Set(game.folders.contents.map(folder => folder.id));

    const importOptions: Record<string, unknown> = { keepId: options.keepId };
    if (options.folderId !== undefined) {
      importOptions['folderId'] = options.folderId;
    } else if (options.folderName !== undefined) {
      importOptions['folderName'] = options.folderName;
    }
    const created = await pack.importAll(importOptions);

    // importAll creates its top-level folder itself and does not return it.
    const folderName = options.folderName ?? pack.title;
    const folder =
      options.folderId !== undefined
        ? game.folders.get(options.folderId)
        : game.folders.contents.find(
            candidate =>
              !knownFolderIds.has(candidate.id) &&
              candidate.type === pack.metadata.type &&
              (candidate._source.folder ?? null) === null &&
              candidate.name === folderName
          );
    return {
      folder: folder ? { id: folder.id, name: folder.name } : null,
      documents: created.map(toWorldRef)
    };
  }

  // No core call imports one pack folder; this follows `importAll` step by step
  // for the subtree: folders keep their ids (existing ones are reused), each
  // document goes through `WorldCollection#fromCompendium`, creation in chunks.
  async importPackFolder(packId: string, plan: PackFolderImportPlan): Promise<PackFolderImportOutcome> {
    const game = this.gameProvider.getGame();
    const pack = this.requirePack(game, packId);
    const collection = this.requireCollection(game, pack.metadata.type);
    const folderClass = this.globals.folderClass();
    if (!folderClass) {
      throw new WorldDocumentClassUnavailableError('Folder');
    }

    const [rootId = ''] = plan.folderIds;
    const folderData = plan.folderIds
      .filter(id => !game.folders.has(id))
      .flatMap(id => {
        const folder = pack.folders.get(id);
        if (!folder) return [];
        const data = folder.toObject();
        if (id === rootId) data['folder'] = plan.parentFolderId;
        return [data];
      });
    const createdFolders = folderData.length > 0 ? await folderClass.createDocuments(folderData, { keepId: true }) : [];

    const documents = await this.loadDocuments(pack, plan.documentIds);
    const createData = documents.map(document => collection.fromCompendium(document, { keepId: plan.keepId }));
    const created: FoundryCreatedWorldDocument[] = [];
    for (let start = 0; start < createData.length; start += CREATE_CHUNK_SIZE) {
      const chunk = createData.slice(start, start + CREATE_CHUNK_SIZE);
      created.push(...(await collection.documentClass.createDocuments(chunk, { keepId: plan.keepId })));
    }

    const root = game.folders.get(rootId);
    return {
      folder: root
        ? { id: root.id, name: root.name }
        : { id: rootId, name: pack.folders.get(rootId)?.name ?? '' },
      createdFolderCount: createdFolders.length,
      documents: created.map(toWorldRef)
    };
  }

  // `importAll` cannot leave documents out, so this follows it step by step (Foundry 13.351 / 14.368): reuse or
  // create the top-level folder, create the missing pack folders under it, `fromCompendium` every remaining
  // document, put a document without a folder into the top-level one, create in chunks.
  private async importPackWithout(
    game: FoundryManagementGame,
    pack: FoundryManagedPack,
    options: PackImportOptions,
    skipped: ReadonlySet<string>
  ): Promise<PackImportOutcome> {
    const collection = this.requireCollection(game, pack.metadata.type);
    const folderClass = this.globals.folderClass();
    if (!folderClass) {
      throw new WorldDocumentClassUnavailableError('Folder');
    }

    const root = await this.importRootFolder(game, pack, options, folderClass);
    const folderData = pack.folders.contents
      .filter(folder => !game.folders.has(folder.id))
      .map(folder => {
        const data = folder.toObject();
        if (!data['folder']) data['folder'] = root.id;
        return data;
      });
    if (folderData.length > 0) {
      await folderClass.createDocuments(folderData, { keepId: true });
    }

    const importOptions = { keepId: options.keepId };
    const documents = (await pack.getDocuments()).filter(document => !skipped.has(document.id));
    const createData = documents.map(document => {
      const data = collection.fromCompendium(document, importOptions);
      if (!data['folder']) data['folder'] = root.id;
      return data;
    });
    const created: FoundryCreatedWorldDocument[] = [];
    for (let start = 0; start < createData.length; start += CREATE_CHUNK_SIZE) {
      const chunk = createData.slice(start, start + CREATE_CHUNK_SIZE);
      created.push(...(await collection.documentClass.createDocuments(chunk, importOptions)));
    }
    return { folder: { id: root.id, name: root.name }, documents: created.map(toWorldRef) };
  }

  private async importRootFolder(
    game: FoundryManagementGame,
    pack: FoundryManagedPack,
    options: PackImportOptions,
    folderClass: FoundryFolderClass
  ): Promise<WorldDocumentRef> {
    const existing: FoundryWorldFolder | undefined =
      options.folderId !== undefined ? game.folders.get(options.folderId) : undefined;
    if (existing) {
      return { id: existing.id, name: existing.name };
    }
    const [created] = await folderClass.createDocuments(
      [
        {
          name: options.folderName || pack.title,
          type: pack.metadata.type,
          folder: null,
          color: pack.folder?.color ?? null
        }
      ],
      { keepId: false }
    );
    if (!created) {
      throw new ImportFolderCreationFailedError(pack.collection);
    }
    return { id: created.id, name: created.name };
  }

  private async loadDocuments(
    pack: FoundryManagedPack,
    documentIds: readonly string[]
  ): Promise<readonly FoundryPackDocumentLike[]> {
    if (documentIds.length === 0) return [];
    if (this.generation() >= SERVER_QUERY_MIN_GENERATION) {
      return pack.getDocuments({ _id__in: [...documentIds] });
    }
    const wanted = new Set(documentIds);
    return (await pack.getDocuments()).filter(document => wanted.has(document.id));
  }

  private requirePack(game: FoundryManagementGame, packId: string): FoundryManagedPack {
    const pack = game.packs.get(packId);
    if (!pack) {
      throw new PackNotFoundError(packId);
    }
    return pack;
  }

  private requireCollection(game: FoundryManagementGame, documentType: string): FoundryWorldCollection {
    const collection = game.collections.get(documentType);
    if (!collection) {
      throw new WorldDocumentClassUnavailableError(documentType);
    }
    return collection;
  }
}

function toWorldRef(document: FoundryCreatedWorldDocument): WorldDocumentRef {
  return { id: document.id, name: document.name };
}
