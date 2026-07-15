import {
  AdventureImportUnsupportedError,
  EmbeddedItemCreationFailedError,
  ImportCreationFailedError,
  PackNotFoundError,
  PackTypeMismatchError,
  WorldActorNotFoundError
} from '@/compendiums/domain';
import type {
  ActorInventory,
  CreatedActorView,
  CreatedItemView,
  PackCatalog,
  PackDescriptor,
  PackDocumentReader,
  WorldImporter
} from '@/compendiums/domain';
import type {
  AddItemToActorCommand,
  ImportActorCommand,
  ImportDocumentCommand,
  ImportItemCommand
} from './queries';
import type { AddItemToActorResult, ImportDocumentResult } from './results';

export interface CompendiumImportServiceDependencies {
  readonly catalog: PackCatalog;
  readonly documentReader: PackDocumentReader;
  readonly worldImporter: WorldImporter;
  readonly actorInventory: ActorInventory;
}

export class CompendiumImportService {
  constructor(private readonly deps: CompendiumImportServiceDependencies) {}

  async importDocument(command: ImportDocumentCommand): Promise<ImportDocumentResult> {
    const pack = this.requirePack(command.packId);

    if (pack.type === 'Adventure') {
      throw new AdventureImportUnsupportedError(command.packId);
    }

    const data = await this.deps.documentReader.readDocumentSource(
      command.packId,
      command.documentId
    );
    delete data['_id'];
    if (command.name !== undefined) {
      data['name'] = command.name;
    }
    if (command.folder !== undefined) {
      data['folder'] = command.folder;
    }

    const created = await this.deps.worldImporter.createByDocumentType(pack.type, data);
    if (!created) {
      throw new ImportCreationFailedError(command.documentId);
    }

    return {
      worldId: created.id,
      uuid: created.uuid,
      name: created.name,
      documentType: pack.type
    };
  }

  async importActor(command: ImportActorCommand): Promise<CreatedActorView> {
    const pack = this.requirePack(command.packId);
    if (pack.type !== 'Actor') {
      throw new PackTypeMismatchError(command.packId, 'Actor', pack.type);
    }

    const data = await this.deps.documentReader.readDocumentSource(
      command.packId,
      command.actorId
    );
    if (command.name !== undefined) {
      data['name'] = command.name;
    }
    if (command.folder !== undefined) {
      data['folder'] = command.folder;
    }
    delete data['_id'];

    return this.deps.worldImporter.createActor(data);
  }

  async importItem(command: ImportItemCommand): Promise<CreatedItemView> {
    const pack = this.requirePack(command.packId);
    if (pack.type !== 'Item') {
      throw new PackTypeMismatchError(command.packId, 'Item', pack.type);
    }

    const data = await this.deps.documentReader.readDocumentSource(
      command.packId,
      command.itemId
    );
    delete data['_id'];
    if (command.name !== undefined) {
      data['name'] = command.name;
    }
    if (command.folder !== undefined) {
      data['folder'] = command.folder;
    }

    return this.deps.worldImporter.createItem(data);
  }

  async addItemToActor(command: AddItemToActorCommand): Promise<AddItemToActorResult> {
    const actor = this.deps.actorInventory.findActor(command.actorId);
    if (actor === null) {
      throw new WorldActorNotFoundError(command.actorId);
    }

    const pack = this.requirePack(command.packId);
    if (pack.type !== 'Item') {
      throw new PackTypeMismatchError(command.packId, 'Item', pack.type);
    }

    const data = await this.deps.documentReader.readDocumentSource(
      command.packId,
      command.itemId
    );
    delete data['_id'];
    if (command.name !== undefined) {
      data['name'] = command.name;
    }
    if (command.quantity !== undefined) {
      const existingSystem = data['system'];
      const system = (existingSystem as Record<string, unknown> | undefined) ?? {};
      system['quantity'] = command.quantity;
      data['system'] = system;
    }

    const created = await this.deps.actorInventory.createEmbeddedItem(
      command.actorId,
      data
    );
    if (!created) {
      throw new EmbeddedItemCreationFailedError();
    }

    return { item: created, actor };
  }

  private requirePack(packId: string): PackDescriptor {
    const pack = this.deps.catalog.findPack(packId);
    if (pack === null) {
      throw new PackNotFoundError(packId);
    }
    return pack;
  }
}
