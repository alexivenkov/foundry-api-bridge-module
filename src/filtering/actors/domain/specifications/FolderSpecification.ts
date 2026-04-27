import { CompositeSpecification } from '@/filtering/shared/domain/specification';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

export class FolderSpecification extends CompositeSpecification<ActorSnapshot> {
  constructor(private readonly allowedFolderIds: ReadonlySet<string>) {
    super();
  }

  override isSatisfiedBy(actor: ActorSnapshot): boolean {
    if (actor.folderId === null) {
      return false;
    }
    return this.allowedFolderIds.has(actor.folderId);
  }
}
