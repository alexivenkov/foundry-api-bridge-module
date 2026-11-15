import type { OwnershipChanges, SortPosition, TransferableDocumentType } from '@/core/documents/domain';

export interface DocumentQuery {
  readonly uuid: string;
}

export interface SetOwnershipCommand {
  readonly uuid: string;
  readonly changes: OwnershipChanges;
}

export interface GetFlagsQuery {
  readonly uuid: string;
  readonly scope: string | undefined;
}

export interface SetFlagCommand {
  readonly uuid: string;
  readonly scope: string;
  readonly key: string;
  readonly value: unknown;
}

export interface UnsetFlagCommand {
  readonly uuid: string;
  readonly scope: string;
  readonly key: string;
}

export interface SortDocumentCommand {
  readonly uuid: string;
  readonly targetUuid: string;
  readonly position: SortPosition;
}

export interface ImportDocumentCommand {
  readonly documentType: TransferableDocumentType;
  readonly data: Readonly<Record<string, unknown>>;
  readonly folderId: string | undefined;
}
