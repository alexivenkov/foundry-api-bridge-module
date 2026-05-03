import type {
  WallSummary,
  WallDoorType,
  WallDoorState,
  WallRestriction,
  WallDirection
} from '@/commands/types';

export interface FoundryWallDocument {
  _id: string;
  c: number[];
  door: number;
  ds: number | undefined;
  move: number | undefined;
  sense: number | undefined;
  sound: number | undefined;
  light: number | undefined;
  dir: number | undefined;
  update(data: Record<string, unknown>): Promise<FoundryWallDocument>;
}

export interface WallsCollection {
  get(id: string): FoundryWallDocument | undefined;
  contents: FoundryWallDocument[];
}

export interface WallScene {
  id: string;
  walls: WallsCollection;
  createEmbeddedDocuments(type: 'Wall', data: Record<string, unknown>[]): Promise<FoundryWallDocument[]>;
  deleteEmbeddedDocuments(type: 'Wall', ids: string[]): Promise<unknown[]>;
}

export interface WallScenesCollection {
  get(id: string): WallScene | undefined;
  active: WallScene | null;
}

export interface WallGame {
  scenes: WallScenesCollection;
}

export function getGame(): WallGame {
  return (globalThis as unknown as { game: WallGame }).game;
}

export function getSceneById(sceneId: string | undefined): WallScene {
  const game = getGame();

  if (sceneId === undefined) {
    if (!game.scenes.active) {
      throw new Error('No active scene; specify sceneId');
    }
    return game.scenes.active;
  }

  const scene = game.scenes.get(sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  return scene;
}

export function getWall(scene: WallScene, wallId: string): FoundryWallDocument {
  const wall = scene.walls.get(wallId);
  if (!wall) {
    throw new Error(`Wall not found: ${wallId}`);
  }
  return wall;
}

const DOOR_TYPE_TO_NUMBER: Record<WallDoorType, number> = {
  none: 0,
  door: 1,
  secret: 2
};

const DOOR_TYPE_FROM_NUMBER: Record<number, WallDoorType> = {
  0: 'none',
  1: 'door',
  2: 'secret'
};

const DOOR_STATE_TO_NUMBER: Record<WallDoorState, number> = {
  closed: 0,
  open: 1,
  locked: 2
};

const DOOR_STATE_FROM_NUMBER: Record<number, WallDoorState> = {
  0: 'closed',
  1: 'open',
  2: 'locked'
};

const RESTRICTION_TO_NUMBER: Record<WallRestriction, number> = {
  none: 0,
  normal: 1,
  limited: 2
};

const RESTRICTION_FROM_NUMBER: Record<number, WallRestriction> = {
  0: 'none',
  1: 'normal',
  2: 'limited'
};

const DIRECTION_TO_NUMBER: Record<WallDirection, number> = {
  both: 0,
  left: 1,
  right: 2
};

const DIRECTION_FROM_NUMBER: Record<number, WallDirection> = {
  0: 'both',
  1: 'left',
  2: 'right'
};

export function doorTypeToNumber(value: WallDoorType): number {
  return DOOR_TYPE_TO_NUMBER[value];
}

export function doorTypeFromNumber(value: number): WallDoorType {
  return DOOR_TYPE_FROM_NUMBER[value] ?? 'none';
}

export function doorStateToNumber(value: WallDoorState): number {
  return DOOR_STATE_TO_NUMBER[value];
}

export function doorStateFromNumber(value: number): WallDoorState {
  return DOOR_STATE_FROM_NUMBER[value] ?? 'closed';
}

export function restrictionToNumber(value: WallRestriction): number {
  return RESTRICTION_TO_NUMBER[value];
}

export function restrictionFromNumber(value: number): WallRestriction {
  return RESTRICTION_FROM_NUMBER[value] ?? 'normal';
}

export function directionToNumber(value: WallDirection): number {
  return DIRECTION_TO_NUMBER[value];
}

export function directionFromNumber(value: number): WallDirection {
  return DIRECTION_FROM_NUMBER[value] ?? 'both';
}

function coordsToTuple(c: number[]): [number, number, number, number] {
  return [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, c[3] ?? 0];
}

export function mapWallToSummary(wall: FoundryWallDocument): WallSummary {
  return {
    id: wall._id,
    c: coordsToTuple(wall.c),
    door: doorTypeFromNumber(wall.door),
    doorState: doorStateFromNumber(wall.ds ?? 0),
    move: restrictionFromNumber(wall.move ?? 1),
    sense: restrictionFromNumber(wall.sense ?? 1),
    sound: restrictionFromNumber(wall.sound ?? 1),
    light: restrictionFromNumber(wall.light ?? 1),
    dir: directionFromNumber(wall.dir ?? 0)
  };
}
