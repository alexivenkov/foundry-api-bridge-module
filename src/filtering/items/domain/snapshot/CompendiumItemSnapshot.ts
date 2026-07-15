import type { ItemSnapshot } from './ItemSnapshot';

// Enriched snapshot for compendium-backed filtering: every ItemSnapshot
// specification applies unchanged, while results stay addressable across
// packs (pack-local ids may collide between packs; uuid never does).
export interface CompendiumItemSnapshot extends ItemSnapshot {
  readonly packId: string;
  readonly uuid: string;
}
