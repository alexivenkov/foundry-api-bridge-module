import {
  AdventureOverwriteRefusedError,
  MACRO_DOCUMENT_TYPE,
  PackDocumentNotFoundError,
  countDocuments,
  isScriptMacroSource,
  summarizeGroups
} from '@/compendiums/domain';
import type {
  AdventureDocumentGroup,
  AdventureGateway,
  AdventureHeader,
  AdventureImportOutcome,
  AdventureImportPlan,
  AdventureImportRequest,
  WorldDocumentRef
} from '@/compendiums/domain';
import type {
  FoundryAdventureClass,
  FoundryAdventureDocument,
  FoundryAdventureImportData,
  FoundryAdventurePreImport,
  FoundryAdventureSource
} from './foundryAdventureTypes';
import type {
  FoundryCreatedWorldDocument,
  PackManagementGameProvider,
  PackManagementGlobals
} from './foundryPackManagementTypes';

const FOLDER = 'Folder';

// Wraps `Adventure#prepareImport` (which splits the content into documents to
// create and world documents with the same id to replace) and `Adventure#import`
// (hooks, the importer sheet's own steps, the world's import record).
export class FoundryAdventureGateway implements AdventureGateway {
  constructor(
    private readonly gameProvider: PackManagementGameProvider,
    private readonly globals: PackManagementGlobals
  ) {}

  isAvailable(): boolean {
    const prototype = this.globals.adventureClass()?.prototype;
    return typeof prototype?.prepareImport === 'function' && typeof prototype.import === 'function';
  }

  contentTypes(): readonly string[] {
    return this.contentFields().map(([, documentName]) => documentName);
  }

  async readAdventure(packId: string, adventureId: string): Promise<AdventureHeader | null> {
    const adventure = await this.loadAdventure(packId, adventureId);
    if (!adventure) return null;
    return {
      id: adventure.id,
      uuid: adventure.uuid,
      name: adventure.name,
      img: adventure.img ?? null,
      caption: adventure.caption ?? '',
      description: adventure.description ?? '',
      imported: this.wasImported(adventure.uuid)
    };
  }

  async planImport(
    packId: string,
    adventureId: string,
    documentTypes?: readonly string[]
  ): Promise<AdventureImportPlan> {
    const adventure = await this.requireAdventure(packId, adventureId);
    const data = await adventure.prepareImport({ importFields: this.importFields(documentTypes) });
    const scriptMacros = scriptMacroRefs(data);
    return {
      toCreate: this.sourceGroups(data.toCreate),
      toUpdate: this.sourceGroups(data.toUpdate),
      ...(scriptMacros.length > 0 ? { scriptMacros } : {})
    };
  }

  async importAdventure(
    packId: string,
    adventureId: string,
    request: AdventureImportRequest
  ): Promise<AdventureImportOutcome | null> {
    const adventure = await this.requireAdventure(packId, adventureId);
    // Runs after the preImportAdventure hook, right before anything is written.
    const refuseOverwrite: FoundryAdventurePreImport = importData => {
      const toUpdate = this.sourceGroups(importData.toUpdate);
      const count = countDocuments(toUpdate);
      if (count > 0) {
        throw new AdventureOverwriteRefusedError(adventure.name, count, summarizeGroups(toUpdate));
      }
    };

    // Runs first, so a script macro that is left out does not count as an overwrite either.
    const skipped: WorldDocumentRef[] = [];
    const skipScriptMacros: FoundryAdventurePreImport = importData => {
      skipped.push(...removeScriptMacros(importData));
    };

    const result = await adventure.import({
      dialog: false,
      importFields: this.importFields(request.documentTypes),
      preImport: [
        ...(request.skipScriptMacros === true ? [skipScriptMacros] : []),
        ...(request.allowOverwrite ? [] : [refuseOverwrite])
      ]
    });
    if (Array.isArray(result.created) || Array.isArray(result.updated)) {
      return null;
    }
    return {
      created: this.documentGroups(result.created),
      updated: this.documentGroups(result.updated),
      ...(request.skipScriptMacros === true ? { skippedScriptMacros: skipped } : {})
    };
  }

  private async loadAdventure(packId: string, adventureId: string): Promise<FoundryAdventureDocument | null> {
    const document: unknown = await this.gameProvider.getGame().packs.get(packId)?.getDocument(adventureId);
    if (typeof document !== 'object' || document === null) return null;
    if (typeof (document as { prepareImport?: unknown }).prepareImport !== 'function') return null;
    return document as FoundryAdventureDocument;
  }

  private async requireAdventure(packId: string, adventureId: string): Promise<FoundryAdventureDocument> {
    const adventure = await this.loadAdventure(packId, adventureId);
    if (!adventure) {
      throw new PackDocumentNotFoundError(packId, adventureId);
    }
    return adventure;
  }

  private contentFields(): [field: string, documentName: string][] {
    const adventureClass: FoundryAdventureClass | undefined = this.globals.adventureClass();
    return Object.entries(adventureClass?.contentFields ?? {}).map(([field, cls]) => [field, cls.documentName]);
  }

  // An empty list imports everything; a selection takes the folders along,
  // which the core then narrows to the selected types.
  private importFields(documentTypes: readonly string[] | undefined): string[] {
    if (documentTypes === undefined) return [];
    const selected = new Set([...documentTypes, FOLDER]);
    return this.contentFields()
      .filter(([, documentName]) => selected.has(documentName))
      .map(([field]) => field);
  }

  private sourceGroups(
    byType: Readonly<Record<string, FoundryAdventureSource[] | undefined>>
  ): AdventureDocumentGroup[] {
    return this.orderedGroups(byType, source => ({ id: source._id ?? '', name: source.name ?? '' }));
  }

  private documentGroups(
    byType: Readonly<Record<string, FoundryCreatedWorldDocument[] | undefined>>
  ): AdventureDocumentGroup[] {
    return this.orderedGroups(byType, document => ({ id: document.id, name: document.name }));
  }

  private orderedGroups<T>(
    byType: Readonly<Record<string, T[] | undefined>>,
    toRef: (entry: T) => { id: string; name: string }
  ): AdventureDocumentGroup[] {
    const order = this.contentTypes();
    const types = [...order.filter(type => type in byType), ...Object.keys(byType).filter(type => !order.includes(type))];
    return types.flatMap(documentType => {
      const entries = byType[documentType] ?? [];
      return entries.length > 0 ? [{ documentType, documents: entries.map(toRef) }] : [];
    });
  }

  private wasImported(uuid: string): boolean {
    try {
      const imports = this.gameProvider.getGame().settings.get('core', 'adventureImports');
      return typeof imports === 'object' && imports !== null && Boolean((imports as Record<string, unknown>)[uuid]);
    } catch {
      return false;
    }
  }
}

function scriptMacroSources(sources: FoundryAdventureSource[] | undefined): FoundryAdventureSource[] {
  return (sources ?? []).filter(source => isScriptMacroSource(source));
}

function toRef(source: FoundryAdventureSource): WorldDocumentRef {
  return { id: source._id ?? '', name: source.name ?? '' };
}

function scriptMacroRefs(importData: FoundryAdventureImportData): WorldDocumentRef[] {
  return [
    ...scriptMacroSources(importData.toCreate[MACRO_DOCUMENT_TYPE]),
    ...scriptMacroSources(importData.toUpdate[MACRO_DOCUMENT_TYPE])
  ].map(toRef);
}

// `Adventure#import` hands the same import data to `importContent` after its `preImport` steps (Foundry 13.351 /
// 14.368), so removing the sources here keeps them out of the world; `documentCount` drives its progress bar.
function removeScriptMacros(importData: FoundryAdventureImportData): WorldDocumentRef[] {
  const removed = scriptMacroRefs(importData);
  for (const group of [importData.toCreate, importData.toUpdate]) {
    const kept = (group[MACRO_DOCUMENT_TYPE] ?? []).filter(source => !isScriptMacroSource(source));
    if (kept.length > 0) {
      group[MACRO_DOCUMENT_TYPE] = kept;
    } else {
      Reflect.deleteProperty(group, MACRO_DOCUMENT_TYPE);
    }
  }
  importData.documentCount -= removed.length;
  return removed;
}
