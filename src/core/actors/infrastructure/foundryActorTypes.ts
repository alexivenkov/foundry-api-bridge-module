import type { FoundryActorsGame } from '@/core/shared';

/** An Item embedded in an actor, as `get-actor` reads it. */
export interface FoundryActorItem {
  id: string;
  name: string;
  type: string;
  img: string | null | undefined;
  toObject(source: boolean): { system: Record<string, unknown> };
}

/** The Actor document fields and methods the context uses (`BaseActor` schema, Foundry 13–14). */
export interface FoundryActorDocument {
  id: string;
  uuid: string;
  name: string;
  type: string;
  /** A nullable file path in the schema. */
  img: string | null | undefined;
  folder: { name: string } | null;
  items: { forEach(fn: (item: FoundryActorItem) => void): void };
  getRollData(): Record<string, unknown>;
  _source?: { system?: Record<string, unknown> };
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface FoundryActorsCollection {
  get(id: string): FoundryActorDocument | undefined;
  forEach(fn: (actor: FoundryActorDocument) => void): void;
  documentClass: {
    /** Resolves to `undefined` when a `preCreate` hook vetoes the creation. */
    create(data: Record<string, unknown>): Promise<FoundryActorDocument | undefined>;
  };
}

export interface FoundryActorGame extends FoundryActorsGame<FoundryActorDocument> {
  actors: FoundryActorsCollection;
}
