import type { FoundryActorWithAttributes } from '@/core/shared';
import type { MapCollisionTest } from '@/core/combat/domain';

// What a turn description reads from a scene. Tokens and walls have richer
// types in their own contexts; here only these few fields are needed, and the
// wall ones raw.

export interface FoundryBattlefieldActor extends FoundryActorWithAttributes {
  id: string;
  statuses?: Set<string>;
}

export interface FoundryBattlefieldToken {
  id: string;
  name: string | undefined;
  x: number;
  y: number;
  width: number | undefined;
  height: number | undefined;
  disposition: number | undefined;
  actor: FoundryBattlefieldActor | null;
}

export interface FoundryBattlefieldWall {
  c: number[];
  door: number;
  ds: number | undefined;
  move: number;
}

export interface FoundryBattlefieldGrid {
  size: number | undefined;
  distance: number | undefined;
  units: string | undefined;
}

export interface FoundryBattlefieldScene {
  id: string;
  name: string;
  grid: FoundryBattlefieldGrid;
  tokens: { contents: FoundryBattlefieldToken[] };
  walls: { contents: FoundryBattlefieldWall[] };
}

export interface FoundryBattlefieldGlobals {
  /** `canvas.scene` is the scene this client views. */
  canvas?: { scene?: FoundryBattlefieldScene | null | undefined } | null | undefined;
  CONFIG?: {
    Canvas?: {
      polygonBackends?: {
        move?: MapCollisionTest;
        sight?: MapCollisionTest;
      };
    };
  };
}
