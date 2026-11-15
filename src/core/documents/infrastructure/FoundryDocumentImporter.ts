import {
  DocumentImportRejectedError,
  type DocumentImporter,
  type ImportFolder,
  type ImportedDocument,
  type ScriptContentKind,
  type TransferableDocumentType
} from '@/core/documents/domain';
import { sourceString, toDocumentReference, toPlainRecord } from './documentMapper';
import { FoundryDocumentResolver } from './FoundryDocumentResolver';
import {
  documentClassOf,
  type DocumentGlobalsProvider,
  type FoundryDocument,
  type FoundryDocumentClass
} from './foundryDocumentTypes';

// Field names of `BaseMacro` (`type`), `BaseScene` (`regions`), `BaseRegion` (`behaviors`) and the executeScript /
// executeMacro behavior types (`system.uuid`), Foundry 13.351 and 14.368.
const SCRIPT_MACRO_TYPE = 'script';
const EXECUTE_SCRIPT_BEHAVIOR = 'executeScript';
const EXECUTE_MACRO_BEHAVIOR = 'executeMacro';

const DETAIL_MAX_LENGTH = 500;

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    : [];
}

function describeFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const compact = message.split('\n').map((line) => line.trim()).filter((line) => line.length > 0).join(' ');
  return compact.length > DETAIL_MAX_LENGTH ? `${compact.slice(0, DETAIL_MAX_LENGTH)}…` : compact;
}

/**
 * Creates a world document from exported data the way "Import Data" prepares it, but as a new document:
 * `fromImport` (server-side migration of older data, strict validation; plain `fromSource` before Foundry 12) then
 * `WorldCollection#fromCompendium` (fresh id, no sort / folder / state, default ownership with the GM as owner).
 * `DocumentCollection#importDocument` (Foundry 14) is avoided: it keeps the id and replaces an existing document.
 */
export class FoundryDocumentImporter implements DocumentImporter {
  private readonly resolver: FoundryDocumentResolver;

  constructor(private readonly globals: DocumentGlobalsProvider) {
    this.resolver = new FoundryDocumentResolver(globals);
  }

  findFolder(folderId: string): ImportFolder | null {
    const folder = this.globals().game.folders.get(folderId);
    return folder !== undefined ? { id: folderId, type: sourceString(folder, 'type') ?? '' } : null;
  }

  async findScriptContent(
    documentType: TransferableDocumentType,
    data: Readonly<Record<string, unknown>>
  ): Promise<readonly ScriptContentKind[]> {
    if (documentType === 'Macro') {
      return data['type'] === SCRIPT_MACRO_TYPE ? ['script macro'] : [];
    }
    if (documentType !== 'Scene') {
      return [];
    }
    const found: ScriptContentKind[] = [];
    for (const region of records(data['regions'])) {
      for (const behavior of records(region['behaviors'])) {
        if (behavior['type'] === EXECUTE_SCRIPT_BEHAVIOR) {
          found.push('executeScript region behavior');
        } else if (behavior['type'] === EXECUTE_MACRO_BEHAVIOR && (await this.targetsScriptMacro(behavior))) {
          found.push('executeMacro region behavior aimed at a script macro');
        }
      }
    }
    return found;
  }

  async importDocument(
    documentType: TransferableDocumentType,
    data: Readonly<Record<string, unknown>>,
    folderId: string | null
  ): Promise<ImportedDocument | null> {
    const { game } = this.globals();
    const documentClass = documentClassOf(this.globals(), documentType);
    const collection = game.collections.get(documentType);
    if (documentClass === null || collection === undefined) {
      throw new DocumentImportRejectedError(documentType, 'the world has no collection for this document type');
    }

    let created: FoundryDocument | null;
    try {
      const source = await this.readSource(documentClass, toPlainRecord(data));
      const createData = collection.fromCompendium(source, {
        clearFolder: true,
        clearSort: true,
        clearOwnership: true,
        clearState: true,
        keepId: false
      });
      createData['folder'] = folderId;
      created = (await documentClass.create(createData)) ?? null;
    } catch (error) {
      throw new DocumentImportRejectedError(documentType, describeFailure(error));
    }
    if (created === null) {
      return null;
    }
    return { document: toDocumentReference(created), folderId: sourceString(created, 'folder') };
  }

  private readSource(documentClass: FoundryDocumentClass, data: Record<string, unknown>): Promise<FoundryDocument> {
    if (typeof documentClass.fromImport === 'function') {
      return documentClass.fromImport(data);
    }
    return Promise.resolve(documentClass.fromSource(data, { strict: true }));
  }

  private async targetsScriptMacro(behavior: Record<string, unknown>): Promise<boolean> {
    const system = behavior['system'];
    const macroUuid = system !== null && typeof system === 'object' ? (system as Record<string, unknown>)['uuid'] : null;
    if (typeof macroUuid !== 'string' || macroUuid.length === 0) {
      return false;
    }
    const macro = await this.resolver.resolve(macroUuid);
    return macro?.documentName === 'Macro' && macro._source['type'] === SCRIPT_MACRO_TYPE;
  }
}
