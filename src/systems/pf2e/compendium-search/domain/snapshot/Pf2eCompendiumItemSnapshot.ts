import type { Pf2eSearchableDocument } from './Pf2eCompendiumActorSnapshot';

export interface Pf2eCompendiumItemSnapshot extends Pf2eSearchableDocument {
  readonly category: string | null;
  readonly traditions: readonly string[];
  readonly priceGold: number | null;
}
