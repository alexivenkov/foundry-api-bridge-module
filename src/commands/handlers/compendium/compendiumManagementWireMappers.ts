import type {
  AdventureContentGroup,
  AdventureImportGroup,
  CompendiumDocumentRef,
  CompendiumImportedDocument,
  CompendiumPackInfo,
  GetAdventureResult,
  ImportAdventureResult
} from '@/commands/types';
import type {
  AdventureDetails,
  AdventureDocumentGroup,
  ImportedAdventure,
  PackDocumentRef,
  PackInfo,
  WorldDocumentRef
} from '@/compendiums';

export function toWirePackInfo(info: PackInfo): CompendiumPackInfo {
  return {
    id: info.id,
    label: info.label,
    documentType: info.type,
    system: info.system,
    packageType: info.packageType,
    packageName: info.packageName,
    locked: info.locked,
    ownership: {
      player: info.ownership.player,
      trusted: info.ownership.trusted,
      assistant: info.ownership.assistant
    },
    folderId: info.folderId,
    documentCount: info.documentCount,
    folders: info.folders.map(folder => ({ id: folder.id, name: folder.name, parentId: folder.parentId }))
  };
}

export function toWireDocumentRef(document: PackDocumentRef): CompendiumDocumentRef {
  return {
    id: document.id,
    uuid: document.uuid,
    name: document.name,
    type: document.type,
    img: document.img,
    folderId: document.folderId
  };
}

export function toWireAdventure(details: AdventureDetails): GetAdventureResult {
  return {
    packId: details.packId,
    adventureId: details.id,
    uuid: details.uuid,
    name: details.name,
    img: details.img,
    caption: details.caption,
    description: details.description,
    imported: details.imported,
    contents: details.contents.map(
      (content): AdventureContentGroup => ({
        documentType: content.documentType,
        count: content.entries.length,
        existingCount: content.entries.filter(entry => entry.existsInWorld).length,
        documents: content.entries.map(entry => ({
          id: entry.id,
          name: entry.name,
          existsInWorld: entry.existsInWorld
        }))
      })
    ),
    totalCount: details.totalCount,
    existingCount: details.existingCount
  };
}

export function toWireAdventureImport(imported: ImportedAdventure): ImportAdventureResult {
  const created = imported.created.map(toWireImportGroup);
  const updated = imported.updated.map(toWireImportGroup);
  return {
    packId: imported.packId,
    adventureId: imported.adventureId,
    name: imported.name,
    createdCount: created.reduce((total, group) => total + group.count, 0),
    updatedCount: updated.reduce((total, group) => total + group.count, 0),
    created,
    updated,
    ...toWireSkippedScriptMacros(imported.skippedScriptMacros)
  };
}

/** The field exists only when the import ran without the script opt-in and could have brought macros. */
export function toWireSkippedScriptMacros(
  skipped: readonly WorldDocumentRef[] | undefined
): { skippedScriptMacros?: CompendiumImportedDocument[] } {
  return skipped === undefined
    ? {}
    : { skippedScriptMacros: skipped.map(macro => ({ id: macro.id, name: macro.name })) };
}

function toWireImportGroup(group: AdventureDocumentGroup): AdventureImportGroup {
  return {
    documentType: group.documentType,
    count: group.documents.length,
    documents: group.documents.map(document => ({ id: document.id, name: document.name }))
  };
}
