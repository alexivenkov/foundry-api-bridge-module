/** What the world is and what it runs on. A value the game does not know yet is an empty string. */
export interface WorldIdentity {
  readonly id: string;
  readonly title: string;
  readonly systemId: string;
  readonly systemVersion: string;
  readonly coreVersion: string;
  /** The version of this module, as its manifest states it. */
  readonly moduleVersion: string;
}

export interface WorldDocumentCounts {
  readonly journals: number;
  readonly actors: number;
  readonly items: number;
  readonly scenes: number;
}

export interface CompendiumSummary {
  readonly id: string;
  readonly label: string;
  readonly documentType: string;
  /** Null for a pack that belongs to no game system. */
  readonly systemId: string | null;
  readonly entryCount: number;
}

export interface WorldInfo {
  readonly identity: WorldIdentity;
  readonly counts: WorldDocumentCounts;
  readonly compendiums: readonly CompendiumSummary[];
}
