export interface FoundryWallDocument {
  _id: string;
  c: number[];
  door: number;
  ds: number | undefined;
  move: number;
  sense: number;
  update(data: { ds: number }): Promise<FoundryWallDocument>;
}

export interface DoorWallsCollection {
  get(id: string): FoundryWallDocument | undefined;
  contents: FoundryWallDocument[];
}

export interface DoorScene {
  id: string;
  name: string;
  walls: DoorWallsCollection;
}

export interface DoorScenesCollection {
  get(id: string): DoorScene | undefined;
  active: DoorScene | null;
}

export interface DoorGame {
  scenes: DoorScenesCollection;
}

export function getDoorScene(game: DoorGame, sceneId?: string): DoorScene {
  if (sceneId) {
    const scene = game.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }
    return scene;
  }

  const activeScene = game.scenes.active;
  if (!activeScene) {
    throw new Error('No active scene');
  }
  return activeScene;
}

export function getWall(scene: DoorScene, wallId: string): FoundryWallDocument {
  const wall = scene.walls.get(wallId);
  if (!wall) {
    throw new Error(`Wall not found: ${wallId}`);
  }
  return wall;
}
