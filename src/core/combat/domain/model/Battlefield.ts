import type { ActorVitals } from '@/core/shared/domain';

// The scene an encounter is fought on, as far as a turn description needs it.
// Wall restrictions, door type and door state are the core's own numeric codes,
// passed through as the scene stores them: the map generator reads them raw.

export interface BattlefieldGrid {
  /** Pixels per cell. */
  readonly size: number;
  /** What one cell measures, in `units`. */
  readonly distance: number;
  readonly units: string;
}

export type BattlefieldDisposition = 'secret' | 'hostile' | 'neutral' | 'friendly';

export interface BattlefieldToken {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  /** Size in grid cells. */
  readonly width: number;
  readonly height: number;
  readonly disposition: BattlefieldDisposition;
  readonly actorId: string | null;
  readonly statuses: readonly string[];
  readonly vitals: ActorVitals;
}

export interface BattlefieldWall {
  readonly coordinates: readonly number[];
  readonly door: number;
  readonly doorState: number;
  readonly movement: number;
}

export interface Battlefield {
  readonly sceneName: string;
  /** Whether this client's canvas shows the scene: collision tests can only be asked about that one. */
  readonly onCanvas: boolean;
  readonly grid: BattlefieldGrid;
  readonly tokens: readonly BattlefieldToken[];
  readonly walls: readonly BattlefieldWall[];
}
