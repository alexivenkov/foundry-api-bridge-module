import { CompositeSpecification } from './CompositeSpecification';

export type FolderIdExtractor<T> = (item: T) => string | null;

export class FolderSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly allowedFolderIds: ReadonlySet<string>,
    private readonly extractor: FolderIdExtractor<T>
  ) {
    super();
  }

  override isSatisfiedBy(candidate: T): boolean {
    const folderId = this.extractor(candidate);
    if (folderId === null) {
      return false;
    }
    return this.allowedFolderIds.has(folderId);
  }
}
