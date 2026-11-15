import type { PackFolderNode } from '@/compendiums/domain/model';

/** The folder and all its descendants, parents before children. */
export function packFolderSubtree(
  folders: readonly PackFolderNode[],
  rootId: string
): readonly string[] {
  const subtree: string[] = [rootId];
  const seen = new Set<string>(subtree);
  for (let index = 0; index < subtree.length; index++) {
    const parentId = subtree[index];
    for (const folder of folders) {
      if (folder.parentId === parentId && !seen.has(folder.id)) {
        seen.add(folder.id);
        subtree.push(folder.id);
      }
    }
  }
  return subtree;
}
