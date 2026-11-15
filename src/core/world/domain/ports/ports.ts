import type {
  CompendiumSummary,
  WorldDocumentCounts,
  WorldIdentity
} from '@/core/world/domain/model/WorldInfo';

// Everything here is in memory, so the reads are synchronous.
export interface WorldInspector {
  readIdentity(): WorldIdentity;
  countDocuments(): WorldDocumentCounts;
  listCompendiums(): readonly CompendiumSummary[];
}

/** The world clock, in seconds. Throws `GameNotAvailableError` while there is no game to ask. */
export interface WorldClock {
  now(): number;
  advance(seconds: number): Promise<void>;
  set(worldTime: number): Promise<void>;
}

/** The pause of the game, for every connected client. Throws `GameNotAvailableError` while there is no game to ask. */
export interface GamePause {
  isPaused(): boolean;
  setPaused(paused: boolean): void;
}
