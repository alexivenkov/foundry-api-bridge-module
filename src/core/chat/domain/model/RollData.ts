import type { ActorRef } from '@/core/shared/domain';

export type RollDataValues = Readonly<Record<string, unknown>>;

/** Where the values of a formula's `@path` references come from. */
export interface RollDataSpec {
  /** The actor whose roll data the core hands to the roll, as it is. */
  readonly actor?: ActorRef | undefined;
  /** The caller's values: a top-level key replaces the actor's key of the same name. */
  readonly values?: RollDataValues | undefined;
}

/** Null when the roll uses no roll data at all. */
export function toRollDataSpec(actor: ActorRef | undefined, values: RollDataValues | undefined): RollDataSpec | null {
  return actor === undefined && values === undefined ? null : { actor, values };
}
