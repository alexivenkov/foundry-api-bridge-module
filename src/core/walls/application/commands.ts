import type { DoorState, WallChanges, WallDraft } from '@/core/walls/domain';

export interface ListWallsQuery {
  readonly sceneId: string | undefined;
}

export interface CreateWallCommand {
  readonly sceneId: string | undefined;
  readonly draft: WallDraft;
}

export interface UpdateWallCommand {
  readonly sceneId: string | undefined;
  readonly wallId: string;
  readonly changes: WallChanges;
}

export interface DeleteWallCommand {
  readonly sceneId: string | undefined;
  readonly wallId: string;
}

export interface SetDoorStateCommand {
  readonly sceneId: string | undefined;
  readonly wallId: string;
  readonly state: DoorState;
}
