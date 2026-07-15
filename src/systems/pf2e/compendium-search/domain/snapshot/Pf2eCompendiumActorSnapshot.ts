// Common searchable surface of pf2e compendium documents; both snapshots
// extend it so shared specifications apply to actors and items alike.
export interface Pf2eSearchableDocument {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly level: number | null;
  readonly traits: readonly string[];
  readonly rarity: string | null;
  readonly packId: string;
  readonly uuid: string;
}

export interface Pf2eActorHitPoints {
  readonly current: number;
  readonly max: number;
}

export interface Pf2eCompendiumActorSnapshot extends Pf2eSearchableDocument {
  readonly size: string | null;
  readonly hp: Pf2eActorHitPoints | null;
  readonly ac: number | null;
}
