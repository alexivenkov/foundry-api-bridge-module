import type {
  SceneDetailResult,
  SceneSummaryResult,
  SceneSummary,
  SceneGridType,
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
  text: string | undefined;
  label: string | undefined;
  entryId: string | null | undefined;
}

export interface FoundryWall {
  _id: string;
  c: number[];
  move: number;
  sense: number;
  door: number;
  ds: number | undefined;
}

export interface FoundryGrid {
  size: number | undefined;
  type: number | undefined;
  units: string | undefined;
  distance: number | undefined;
}

export interface FoundryLight {
  x: number;
  y: number;
  config: {
    bright: number | undefined;
    dim: number | undefined;
    color: string | null | undefined;
    angle: number | undefined;
  } | undefined;
  walls: boolean | undefined;
  hidden: boolean | undefined;
}

export interface FoundryTile {
  x: number;
  y: number;
  width: number | undefined;
  height: number | undefined;
  texture: { src: string | undefined } | undefined;
  hidden: boolean | undefined;
  elevation: number | undefined;
  rotation: number | undefined;
}

export interface FoundryDrawing {
  x: number;
  y: number;
  shape: { type: string | undefined; width: number | undefined; height: number | undefined; points: number[] | undefined } | undefined;
  text: string | undefined;
  hidden: boolean | undefined;
  fillColor: string | null | undefined;
  strokeColor: string | null | undefined;
}

export interface FoundryRegionShape {
  type: string | undefined;
}

export interface FoundryRegion {
  id: string;
  name: string | undefined;
  color: string | null | undefined;
  shapes: FoundryRegionShape[] | undefined;
}

export interface FoundryToken {
  id: string;
  name: string | undefined;
  x: number;
  y: number;
  width: number | undefined;
  height: number | undefined;
  elevation: number | undefined;
  hidden: boolean | undefined;
  disposition: number | undefined;
  actor: {
    id: string;
    system?: {
      attributes?: {
        hp?: { value: number; max: number };
        ac?: { value: number };
      };
    };
    statuses?: Set<string>;
  } | null;
}

export interface FoundryScene {
  id: string;
  name: string;
  active: boolean;
  img: string | undefined;
  width: number | undefined;
  height: number | undefined;
  grid: FoundryGrid | undefined;
  darkness: number | undefined;
  notes: { contents: FoundryNote[] } | undefined;
  walls: { contents: FoundryWall[] } | undefined;
  lights: { contents: FoundryLight[] } | undefined;
  tiles: { contents: FoundryTile[] } | undefined;
  drawings: { contents: FoundryDrawing[] } | undefined;
  regions: { contents: FoundryRegion[] } | undefined;
  tokens: { contents: FoundryToken[] } | undefined;
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
    id: wall._id,
    c: wall.c,
    move: wall.move,
    sense: wall.sense,
    door: wall.door,
    ds: wall.ds ?? 0
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
  const result: SceneTokenSummary = {
    id: token.id,
    name: token.name ?? '',
    actorId: token.actor?.id ?? null,
    gridX,
    gridY,
    x: token.x,
    y: token.y,
    elevation: token.elevation ?? 0,
    hidden: token.hidden ?? false,
    disposition: token.disposition ?? 0,
    conditions: token.actor?.statuses ? [...token.actor.statuses] : []
  };

  const hp = token.actor?.system?.attributes?.hp;
  if (hp) {
    result.hp = { value: hp.value, max: hp.max };
  }

  const ac = token.actor?.system?.attributes?.ac;
  if (ac) {
    result.ac = ac.value;
  }

  return result;
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
    tokens: (scene.tokens?.contents ?? []).map(t => mapTokenToSummary(t, gridSize)),
    asciiMap: ''
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

// === Scene CRUD ===

export interface FoundrySceneCrud {
  id: string;
  uuid: string;
  name: string;
  active: boolean;
  width: number | undefined;
  height: number | undefined;
  background: { src?: string } | string | null | undefined;
  navigation: boolean | undefined;
  navName: string | null | undefined;
  navOrder: number | undefined;
  folder: { id: string; name: string } | null | undefined;
  grid: { type: number | undefined; size: number | undefined; distance: number | undefined; units: string | undefined } | undefined;
  update(data: Record<string, unknown>): Promise<FoundrySceneCrud>;
  delete(): Promise<FoundrySceneCrud>;
  clone(data?: Record<string, unknown>, options?: { save?: boolean }): Promise<FoundrySceneCrud> | FoundrySceneCrud;
  view(): Promise<FoundrySceneCrud>;
}

export interface FoundrySceneCrudCollection {
  get(id: string): FoundrySceneCrud | undefined;
}

export interface FoundryGameCrud {
  scenes: FoundrySceneCrudCollection;
}

export interface FoundrySceneConstructor {
  create(data: Record<string, unknown>): Promise<FoundrySceneCrud>;
}

export function getGameCrud(): FoundryGameCrud {
  return (globalThis as unknown as { game: FoundryGameCrud }).game;
}

export function getSceneClass(): FoundrySceneConstructor {
  return (globalThis as unknown as { Scene: FoundrySceneConstructor }).Scene;
}

const GRID_TYPE_TO_NUMBER: Record<SceneGridType, number> = {
  gridless: 0,
  square: 1,
  hexPointyOdd: 2,
  hexPointyEven: 3,
  hexFlatOdd: 4,
  hexFlatEven: 5
};

const GRID_TYPE_FROM_NUMBER: Record<number, SceneGridType> = {
  0: 'gridless',
  1: 'square',
  2: 'hexPointyOdd',
  3: 'hexPointyEven',
  4: 'hexFlatOdd',
  5: 'hexFlatEven'
};

export function gridTypeStringToNumber(type: SceneGridType): number {
  return GRID_TYPE_TO_NUMBER[type];
}

export function gridTypeNumberToString(num: number): SceneGridType {
  return GRID_TYPE_FROM_NUMBER[num] ?? 'square';
}

function extractBackgroundSrc(bg: { src?: string } | string | null | undefined): string | null {
  if (bg === null || bg === undefined) return null;
  if (typeof bg === 'string') return bg.length > 0 ? bg : null;
  return bg.src ?? null;
}

export function mapSceneToCrudSummary(scene: FoundrySceneCrud): SceneSummary {
  return {
    id: scene.id,
    uuid: scene.uuid,
    name: scene.name,
    active: scene.active,
    width: scene.width ?? 0,
    height: scene.height ?? 0,
    background: extractBackgroundSrc(scene.background),
    navigation: scene.navigation ?? false,
    navName: scene.navName ?? null,
    navOrder: scene.navOrder ?? 0,
    folder: scene.folder?.name ?? null,
    grid: {
      type: gridTypeNumberToString(scene.grid?.type ?? 1),
      size: scene.grid?.size ?? 100,
      distance: scene.grid?.distance ?? 5,
      units: scene.grid?.units ?? 'ft'
    }
  };
}
