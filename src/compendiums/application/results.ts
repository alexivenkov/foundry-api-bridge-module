import type {
  ActorRef,
  EmbeddedItemRecord,
  PackDescriptor,
  PackDocumentRecord,
  PackDocumentView,
  PackIndexEntry
} from '@/compendiums/domain';

export interface PackContentsResult {
  readonly pack: PackDescriptor;
  readonly documentCount: number;
  readonly documents: readonly PackDocumentView[];
}

export interface PackIndexResult {
  readonly pack: PackDescriptor;
  readonly total: number;
  readonly entries: readonly PackIndexEntry[];
}

export interface PackSearchResult {
  readonly packId: string;
  readonly results: readonly PackIndexEntry[];
  readonly total: number;
  readonly hasMore: boolean;
}

export interface PackDocumentResult {
  readonly record: PackDocumentRecord;
  readonly documentType: string;
}

export interface ImportDocumentResult {
  readonly worldId: string;
  readonly uuid: string;
  readonly name: string;
  readonly documentType: string;
}

export interface AddItemToActorResult {
  readonly item: EmbeddedItemRecord;
  readonly actor: ActorRef;
}
