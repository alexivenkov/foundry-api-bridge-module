import type {
  SceneDetailResult,
  SceneSummaryResult,
  SceneNoteResult,
  SceneWallResult
} from '@/commands/types';

export interface FoundryNote {
  x: number;
  y: number;
  text: string;
  label: string;
  entryId: string | null;
}

export interface FoundryWall {
  c: number[];
  move: number;
  sense: number;
  door: number;
}

export interface FoundryGrid {
  size: number;
  type: number;
  units: string;
  distance: number;
}

export interface FoundryScene {
  id: string;
  name: string;
  active: boolean;
  img: string;
  width: number;
  height: number;
  grid: FoundryGrid;
  darkness: number;
  notes: { contents: FoundryNote[] };
  walls: { contents: FoundryWall[] };
  tokens: { contents: { id: string }[] };
  activate(): Promise<FoundryScene>;
}

export interface FoundryScenesCollection {
  get(id: string): FoundryScene | undefined;
  active: FoundryScene | null;
  forEach(fn: (scene: FoundryScene) => void): void;
}

export interface FoundryGame {
  scenes: FoundryScenesCollection;
}

export function getScene(game: FoundryGame, sceneId?: string): FoundryScene {
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

export function mapNoteToResult(note: FoundryNote): SceneNoteResult {
  return {
    x: note.x,
    y: note.y,
    text: note.text ?? '',
    label: note.label ?? '',
    entryId: note.entryId ?? null
  };
}

export function mapWallToResult(wall: FoundryWall): SceneWallResult {
  return {
    c: wall.c,
    move: wall.move,
    sense: wall.sense,
    door: wall.door
  };
}

export function mapSceneToDetail(scene: FoundryScene): SceneDetailResult {
  return {
    id: scene.id,
    name: scene.name,
    active: scene.active,
    img: scene.img ?? '',
    width: scene.width ?? 0,
    height: scene.height ?? 0,
    grid: {
      size: scene.grid.size ?? 100,
      type: scene.grid.type ?? 1,
      units: scene.grid.units ?? 'ft',
      distance: scene.grid.distance ?? 5
    },
    darkness: scene.darkness ?? 0,
    notes: (scene.notes?.contents ?? []).map(mapNoteToResult),
    walls: (scene.walls?.contents ?? []).map(mapWallToResult),
    tokenCount: scene.tokens?.contents?.length ?? 0
  };
}

export function mapSceneToSummary(scene: FoundryScene): SceneSummaryResult {
  return {
    id: scene.id,
    name: scene.name,
    active: scene.active,
    img: scene.img ?? ''
  };
}
