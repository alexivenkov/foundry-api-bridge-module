import type {
  SceneDetailResult,
  SceneSummaryResult,
  SceneNoteResult,
  SceneWallResult,
  SceneLightResult,
  SceneTileResult,
  SceneDrawingResult,
  SceneRegionResult,
  SceneTokenSummary
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

export interface FoundryLight {
  x: number;
  y: number;
  config: {
    bright: number;
    dim: number;
    color: string | null;
    angle: number;
  };
  walls: boolean;
  hidden: boolean;
}

export interface FoundryTile {
  x: number;
  y: number;
  width: number;
  height: number;
  texture: { src: string };
  hidden: boolean;
  elevation: number;
  rotation: number;
}

export interface FoundryDrawing {
  x: number;
  y: number;
  shape: { type: string; width: number; height: number; points: number[] };
  text: string;
  hidden: boolean;
  fillColor: string | null;
  strokeColor: string | null;
}

export interface FoundryRegionShape {
  type: string;
}

export interface FoundryRegion {
  id: string;
  name: string;
  color: string | null;
  shapes: FoundryRegionShape[];
}

export interface FoundryToken {
  id: string;
  name: string;
  x: number;
  y: number;
  elevation: number;
  hidden: boolean;
  disposition: number;
  actor: { id: string } | null;
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
  lights: { contents: FoundryLight[] };
  tiles: { contents: FoundryTile[] };
  drawings: { contents: FoundryDrawing[] };
  regions: { contents: FoundryRegion[] };
  tokens: { contents: FoundryToken[] };
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

export function pixelToGrid(x: number, y: number, gridSize: number): { gridX: number; gridY: number } {
  const size = gridSize > 0 ? gridSize : 100;
  return {
    gridX: Math.floor(x / size),
    gridY: Math.floor(y / size)
  };
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

export function mapLightToResult(light: FoundryLight): SceneLightResult {
  return {
    x: light.x,
    y: light.y,
    bright: light.config?.bright ?? 0,
    dim: light.config?.dim ?? 0,
    color: light.config?.color ?? null,
    angle: light.config?.angle ?? 360,
    walls: light.walls ?? true,
    hidden: light.hidden ?? false
  };
}

export function mapTileToResult(tile: FoundryTile): SceneTileResult {
  return {
    x: tile.x,
    y: tile.y,
    width: tile.width ?? 0,
    height: tile.height ?? 0,
    img: tile.texture?.src ?? '',
    hidden: tile.hidden ?? false,
    elevation: tile.elevation ?? 0,
    rotation: tile.rotation ?? 0
  };
}

export function mapDrawingToResult(drawing: FoundryDrawing): SceneDrawingResult {
  return {
    x: drawing.x,
    y: drawing.y,
    shape: {
      type: drawing.shape?.type ?? '',
      width: drawing.shape?.width ?? 0,
      height: drawing.shape?.height ?? 0,
      points: drawing.shape?.points ?? []
    },
    text: drawing.text ?? '',
    hidden: drawing.hidden ?? false,
    fillColor: drawing.fillColor ?? null,
    strokeColor: drawing.strokeColor ?? null
  };
}

export function mapRegionToResult(region: FoundryRegion): SceneRegionResult {
  return {
    id: region.id,
    name: region.name ?? '',
    color: region.color ?? null,
    shapes: (region.shapes ?? []).map(s => ({ type: s.type ?? '' }))
  };
}

export function mapTokenToSummary(token: FoundryToken, gridSize: number): SceneTokenSummary {
  const { gridX, gridY } = pixelToGrid(token.x, token.y, gridSize);
  return {
    id: token.id,
    name: token.name ?? '',
    actorId: token.actor?.id ?? null,
    gridX,
    gridY,
    x: token.x,
    y: token.y,
    elevation: token.elevation ?? 0,
    hidden: token.hidden ?? false,
    disposition: token.disposition ?? 0
  };
}

export function mapSceneToDetail(scene: FoundryScene): SceneDetailResult {
  const gridSize = scene.grid?.size ?? 100;
  return {
    id: scene.id,
    name: scene.name,
    active: scene.active,
    img: scene.img ?? '',
    width: scene.width ?? 0,
    height: scene.height ?? 0,
    grid: {
      size: scene.grid?.size ?? 100,
      type: scene.grid?.type ?? 1,
      units: scene.grid?.units ?? 'ft',
      distance: scene.grid?.distance ?? 5
    },
    darkness: scene.darkness ?? 0,
    notes: (scene.notes?.contents ?? []).map(mapNoteToResult),
    walls: (scene.walls?.contents ?? []).map(mapWallToResult),
    lights: (scene.lights?.contents ?? []).map(mapLightToResult),
    tiles: (scene.tiles?.contents ?? []).map(mapTileToResult),
    drawings: (scene.drawings?.contents ?? []).map(mapDrawingToResult),
    regions: (scene.regions?.contents ?? []).map(mapRegionToResult),
    tokens: (scene.tokens?.contents ?? []).map(t => mapTokenToSummary(t, gridSize))
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
