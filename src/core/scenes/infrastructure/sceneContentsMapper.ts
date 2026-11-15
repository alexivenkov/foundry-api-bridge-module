import { readConventionalVitals } from '@/core/shared';
import type {
  SceneContents,
  SceneDrawing,
  SceneLight,
  SceneNote,
  SceneRegion,
  SceneTile,
  SceneToken,
  SceneWall
} from '@/core/scenes/domain';
import type {
  FoundryPlaceables,
  FoundrySceneDocument,
  FoundrySceneDrawing,
  FoundrySceneLight,
  FoundrySceneNote,
  FoundrySceneRegion,
  FoundrySceneTile,
  FoundrySceneToken,
  FoundrySceneWall
} from './foundrySceneTypes';
import { SQUARE_GRID_CODE } from './sceneCodes';
import { DEFAULT_GRID_DISTANCE, DEFAULT_GRID_SIZE, DEFAULT_GRID_UNITS, readSceneImage } from './sceneMapper';

export type FoundrySceneContentsFields = Pick<
  FoundrySceneDocument,
  | 'id'
  | 'name'
  | 'active'
  | 'img'
  | 'thumb'
  | 'background'
  | 'firstLevel'
  | 'width'
  | 'height'
  | 'grid'
  | 'darkness'
  | 'environment'
  | 'notes'
  | 'walls'
  | 'lights'
  | 'tiles'
  | 'drawings'
  | 'regions'
  | 'tokens'
>;

const FULL_CIRCLE = 360;

function toSceneNote(note: FoundrySceneNote): SceneNote {
  return {
    x: note.x,
    y: note.y,
    text: note.text ?? '',
    label: note.label ?? '',
    entryId: note.entryId ?? null
  };
}

function toSceneWall(wall: FoundrySceneWall): SceneWall {
  return {
    id: wall._id,
    coordinates: wall.c,
    movement: wall.move,
    sight: wall.sight,
    door: wall.door,
    doorState: wall.ds ?? 0
  };
}

function toSceneLight(light: FoundrySceneLight): SceneLight {
  return {
    x: light.x,
    y: light.y,
    bright: light.config?.bright ?? 0,
    dim: light.config?.dim ?? 0,
    color: light.config?.color ?? null,
    angle: light.config?.angle ?? FULL_CIRCLE,
    walls: light.walls ?? true,
    hidden: light.hidden ?? false
  };
}

function toSceneTile(tile: FoundrySceneTile): SceneTile {
  return {
    x: tile.x,
    y: tile.y,
    width: tile.width ?? 0,
    height: tile.height ?? 0,
    textureSrc: tile.texture?.src ?? '',
    hidden: tile.hidden ?? false,
    elevation: tile.elevation ?? 0,
    rotation: tile.rotation ?? 0
  };
}

function toSceneDrawing(drawing: FoundrySceneDrawing): SceneDrawing {
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

function toSceneRegion(region: FoundrySceneRegion): SceneRegion {
  return {
    id: region.id,
    name: region.name ?? '',
    color: region.color ?? null,
    shapeTypes: (region.shapes ?? []).map((shape) => shape.type ?? '')
  };
}

function toSceneToken(token: FoundrySceneToken): SceneToken {
  return {
    id: token.id,
    name: token.name ?? '',
    actorId: token.actor?.id ?? null,
    x: token.x,
    y: token.y,
    width: token.width ?? 1,
    height: token.height ?? 1,
    elevation: token.elevation ?? 0,
    hidden: token.hidden ?? false,
    disposition: token.disposition ?? 0,
    statuses: token.actor?.statuses ? [...token.actor.statuses] : [],
    vitals: readConventionalVitals(token.actor)
  };
}

function mapPlaceables<TDocument, TSnapshot>(
  placeables: FoundryPlaceables<TDocument>,
  toSnapshot: (document: TDocument) => TSnapshot
): TSnapshot[] {
  return (placeables?.contents ?? []).map(toSnapshot);
}

export function toSceneContents(document: FoundrySceneContentsFields): SceneContents {
  return {
    id: document.id,
    name: document.name,
    active: document.active,
    image: readSceneImage(document),
    width: document.width ?? 0,
    height: document.height ?? 0,
    grid: {
      size: document.grid?.size ?? DEFAULT_GRID_SIZE,
      typeCode: document.grid?.type ?? SQUARE_GRID_CODE,
      units: document.grid?.units ?? DEFAULT_GRID_UNITS,
      distance: document.grid?.distance ?? DEFAULT_GRID_DISTANCE
    },
    darkness: document.environment?.darknessLevel ?? document.darkness ?? 0,
    notes: mapPlaceables(document.notes, toSceneNote),
    walls: mapPlaceables(document.walls, toSceneWall),
    lights: mapPlaceables(document.lights, toSceneLight),
    tiles: mapPlaceables(document.tiles, toSceneTile),
    drawings: mapPlaceables(document.drawings, toSceneDrawing),
    regions: mapPlaceables(document.regions, toSceneRegion),
    tokens: mapPlaceables(document.tokens, toSceneToken)
  };
}
