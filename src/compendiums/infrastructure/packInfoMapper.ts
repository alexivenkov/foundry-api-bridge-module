import type { PackDocumentRef, PackInfo } from '@/compendiums/domain';
import type { FoundryManagedPack, FoundryPackDocumentLike } from './foundryPackManagementTypes';
import { fromCoreOwnership } from './packOwnershipCodes';

export function toPackInfo(pack: FoundryManagedPack): PackInfo {
  return {
    id: pack.collection,
    label: pack.metadata.label,
    type: pack.metadata.type,
    system: pack.metadata.system ?? '',
    packageType: pack.metadata.packageType ?? '',
    packageName: pack.metadata.packageName ?? '',
    locked: pack.locked,
    ownership: fromCoreOwnership(pack.ownership),
    folderId: pack.folder?.id ?? null,
    documentCount: pack.index.size,
    folders: pack.folders.contents.map(folder => ({
      id: folder.id,
      name: folder.name,
      parentId: folder._source.folder ?? null
    }))
  };
}

export function toPackDocumentRef(document: FoundryPackDocumentLike): PackDocumentRef {
  return {
    id: document.id,
    uuid: document.uuid,
    name: document.name,
    type: document.type ?? null,
    img: document.img ?? null,
    folderId: document._source.folder ?? null
  };
}
