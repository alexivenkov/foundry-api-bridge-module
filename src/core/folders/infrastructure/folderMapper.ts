import type {
  Folder,
  FolderChanges,
  FolderDeletionOptions,
  FolderDraft,
  FolderTree,
  FolderTreeOptions
} from '@/core/folders/domain';
import type { FoundryFolderDocument, FoundryFolderTreeNode } from './foundryFolderTypes';

export function toFolder(document: FoundryFolderDocument): Folder {
  return {
    id: document.id,
    name: document.name,
    type: document.type,
    color: document.color ?? null,
    description: document.description ?? null,
    parentId: document.folder?.id ?? null,
    sort: document.sort
  };
}

type FolderTreeChild = FoundryFolderTreeNode | FoundryFolderDocument;

// A folder has a `folder` member too — its parent — so a node is told apart by its `entries`.
function isTreeNode(child: FolderTreeChild): child is FoundryFolderTreeNode {
  return 'entries' in child;
}

function toSubtree(
  document: FoundryFolderDocument,
  children: ReadonlyArray<FolderTreeChild> | undefined,
  options: FolderTreeOptions
): FolderTree {
  const folder = toFolder(document);
  const subfolders = options.includeSubfolders
    ? (children ?? []).map((child) =>
        isTreeNode(child)
          ? toSubtree(child.folder, child.children, options)
          : toSubtree(child, child.children, options)
      )
    : [];

  return options.includeContents
    ? { ...folder, subfolders, contentIds: document.contents.map((entry) => entry.id) }
    : { ...folder, subfolders };
}

/**
 * Follows the core's sidebar tree: each child is a node that wraps the
 * subfolder and carries its own children. A child that is a folder itself is
 * read as one.
 */
export function toFolderTree(document: FoundryFolderDocument, options: FolderTreeOptions): FolderTree {
  return toSubtree(document, document.children, options);
}

/** Only the attributes that are set become document fields; the parent is the `folder` field. */
function setOptionalAttributes(data: Record<string, unknown>, changes: FolderChanges): void {
  if (changes.parentId !== undefined) {
    data['folder'] = changes.parentId;
  }
  if (changes.color !== undefined) {
    data['color'] = changes.color;
  }
  if (changes.description !== undefined) {
    data['description'] = changes.description;
  }
  if (changes.sort !== undefined) {
    data['sort'] = changes.sort;
  }
}

export function toFoundryFolderData(draft: FolderDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name, type: draft.type };
  setOptionalAttributes(data, draft);
  return data;
}

export function toFoundryFolderChanges(changes: FolderChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  setOptionalAttributes(data, changes);
  return data;
}

export function toFoundryDeletionOptions(
  options: FolderDeletionOptions
): { deleteSubfolders?: boolean; deleteContents?: boolean } {
  return {
    ...(options.deleteSubfolders !== undefined ? { deleteSubfolders: options.deleteSubfolders } : {}),
    ...(options.deleteContents !== undefined ? { deleteContents: options.deleteContents } : {})
  };
}
