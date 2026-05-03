import { FolderSpecification as SharedFolderSpecification } from '@/filtering/shared/domain/specification';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';

export class FolderSpecification extends SharedFolderSpecification<ItemSnapshot> {
  constructor(allowedFolderIds: ReadonlySet<string>) {
    super(allowedFolderIds, (item) => item.folderId);
  }
}
