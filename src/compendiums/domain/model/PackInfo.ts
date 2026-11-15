import type { PackDescriptor } from './PackSummary';

export type PackOwnershipLevel = 'inherit' | 'none' | 'limited' | 'observer' | 'owner';

export type PackOwnershipRole = 'player' | 'trusted' | 'assistant';

export type PackOwnership = Readonly<Record<PackOwnershipRole, PackOwnershipLevel>>;

export interface PackFolderNode {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
}

export interface PackInfo extends PackDescriptor {
  readonly packageType: string;
  readonly packageName: string;
  readonly locked: boolean;
  readonly ownership: PackOwnership;
  readonly folderId: string | null;
  readonly documentCount: number;
  readonly folders: readonly PackFolderNode[];
}

export interface WorldPackDraft {
  readonly label: string;
  readonly documentType: string;
}

// `ownership: null` resets the pack to the ownership its package declares;
// `folderId: null` moves it to the sidebar root.
export interface PackConfigurationChange {
  readonly locked?: boolean | undefined;
  readonly ownership?: PackOwnership | null | undefined;
  readonly folderId?: string | null | undefined;
}
