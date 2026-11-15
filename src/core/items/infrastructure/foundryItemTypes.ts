import type { FoundryActorsGame } from '@/core/shared';
import type { FoundryItemWithConventionalSystem } from './conventionalItemTraits';

/** A world Item document: the fields and methods the context uses (`BaseItem` schema, Foundry 13–14). */
export interface FoundryWorldItemDocument {
  id: string;
  uuid: string;
  name: string;
  type: string;
  /** A nullable file path in the schema. */
  img: string | null | undefined;
  folder: { name: string } | null;
  toObject(source: boolean): { system: Record<string, unknown> };
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryWorldItemsCollection {
  get(id: string): FoundryWorldItemDocument | undefined;
  forEach(fn: (item: FoundryWorldItemDocument) => void): void;
  documentClass: {
    /** Resolves to `undefined` when a `preCreate` hook vetoes the creation. */
    create(data: Record<string, unknown>): Promise<FoundryWorldItemDocument | undefined>;
  };
}

/** What the core hands back for an Item it created or updated inside an actor. */
export interface FoundryOwnedItemHeader {
  id: string;
  name: string;
  type: string;
  img: string | null | undefined;
}

/** An Item embedded in an actor. Its `system` is read by `conventionalItemTraits` alone. */
export interface FoundryOwnedItemDocument extends FoundryOwnedItemHeader, FoundryItemWithConventionalSystem {
  _source?: { system?: Record<string, unknown> };
}

export interface FoundryItemOwner {
  id: string;
  name: string;
  items: {
    contents: FoundryOwnedItemDocument[];
    get(id: string): FoundryOwnedItemDocument | undefined;
  };
  createEmbeddedDocuments(type: 'Item', data: Record<string, unknown>[]): Promise<FoundryOwnedItemHeader[]>;
  /**
   * Resolves to the documents that changed. An update the core does not carry
   * out — an empty diff, invalid data, a `preUpdate` veto — yields none.
   */
  updateEmbeddedDocuments(type: 'Item', updates: Record<string, unknown>[]): Promise<FoundryOwnedItemHeader[]>;
  deleteEmbeddedDocuments(type: 'Item', ids: string[]): Promise<unknown[]>;
}

export interface FoundryItemGame {
  items: FoundryWorldItemsCollection | undefined;
  actors: { get(id: string): FoundryItemOwner | undefined };
}

/** The actors that own items: world actors, and the actors of scene tokens. */
export type FoundryItemOwnersGame = FoundryActorsGame<FoundryItemOwner>;
