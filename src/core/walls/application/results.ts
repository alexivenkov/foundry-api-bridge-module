import type { DoorState, Wall } from '@/core/walls/domain';

export interface WallListResult {
  readonly sceneId: string;
  readonly walls: readonly Wall[];
}

export interface WallDeletionResult {
  readonly sceneId: string;
  readonly wallId: string;
}

export interface DoorStateChangeResult {
  readonly wall: Wall;
  readonly previousState: DoorState;
}
