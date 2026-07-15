import type { ActorSnapshot } from './ActorSnapshot';

// Enriched snapshot for compendium-backed filtering: every ActorSnapshot
// specification applies unchanged, while results stay addressable across
// packs (pack-local ids may collide between packs; uuid never does).
export interface CompendiumActorSnapshot extends ActorSnapshot {
  readonly packId: string;
  readonly uuid: string;
}
