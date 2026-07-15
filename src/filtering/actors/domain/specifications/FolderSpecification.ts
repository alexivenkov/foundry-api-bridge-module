import { FolderSpecification as SharedFolderSpecification } from '@/kernel/domain/specification';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

export class FolderSpecification extends SharedFolderSpecification<ActorSnapshot> {
  constructor(allowedFolderIds: ReadonlySet<string>) {
    super(allowedFolderIds, (actor) => actor.folderId);
  }
}
