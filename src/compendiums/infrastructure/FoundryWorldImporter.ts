import { WorldDocumentClassUnavailableError } from '@/compendiums/domain';
import type {
  CreatedActorView,
  CreatedItemView,
  CreatedWorldDocumentView,
  ImportedWorldDocument,
  WorldImporter
} from '@/compendiums/domain';
import type { CompendiumGameProvider } from './foundryGameProvider';
import type { FoundryCreatedDocument } from './foundryPackTypes';
import { getDocumentClassForType } from './worldDocumentClasses';

export class FoundryWorldImporter implements WorldImporter {
  constructor(private readonly gameProvider: CompendiumGameProvider) {}

  async createByDocumentType(
    documentType: string,
    data: Record<string, unknown>
  ): Promise<ImportedWorldDocument | null> {
    const docClass = getDocumentClassForType(documentType);
    if (!docClass) {
      throw new WorldDocumentClassUnavailableError(documentType);
    }

    const created = await docClass.create(data);
    if (!created) {
      return null;
    }
    return { id: created.id, uuid: created.uuid, name: created.name };
  }

  async createActor(data: Record<string, unknown>): Promise<CreatedActorView> {
    const actor = await this.gameProvider.getGame().actors.documentClass.create(data);
    return toCreatedView(actor);
  }

  async createItem(data: Record<string, unknown>): Promise<CreatedItemView> {
    const item = await this.gameProvider.getGame().items.documentClass.create(data);
    return toCreatedView(item);
  }
}

function toCreatedView(doc: FoundryCreatedDocument): CreatedWorldDocumentView {
  return {
    id: doc.id,
    uuid: doc.uuid,
    name: doc.name,
    type: doc.type,
    img: doc.img,
    folderName: doc.folder?.name ?? null
  };
}
