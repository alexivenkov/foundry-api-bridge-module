import type { FolderReference } from '../value-objects/FolderReference';

export interface FolderResolver {
  resolve(ref: FolderReference): ReadonlySet<string>;
}
