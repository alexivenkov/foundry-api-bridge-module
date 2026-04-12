import type { MoveTokenParams, TokenResult } from '@/commands/types';
import {
  getActiveScene,
  getToken,
  mapTokenToResult,
  type FoundryGame,
  type FoundryScene,
  type FoundryToken,
  type TokenUpdateData
} from './tokenTypes';
import { findGridPath, type CollisionChecker } from './GridPathfinder';
import {
  createDoorAwareCollision,
  findDoorsAlongPath,
  type DoorOnPath,
  type WallInfo
} from './DoorAwareCollision';

declare const game: FoundryGame;

interface CanvasGlobals {
  canvas?: {
    scene?: {
      grid?: { size?: number | undefined };
    };
  };
  CONFIG?: {
    Canvas?: {
      polygonBackends?: {
        move?: CollisionChecker;
      };
    };
  };
}

function getGlobals(): CanvasGlobals {
  return globalThis as unknown as CanvasGlobals;
}

function isDirectPathBlocked(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  tokenW: number,
  tokenH: number,
  gridSize: number,
  collision: CollisionChecker
): boolean {
  for (let i = 0; i < tokenW; i++) {
    for (let j = 0; j < tokenH; j++) {
      const ox = fromX + i * gridSize + gridSize / 2;
      const oy = fromY + j * gridSize + gridSize / 2;
      const tx = toX + i * gridSize + gridSize / 2;
      const ty = toY + j * gridSize + gridSize / 2;
      if (collision.testCollision(
        { x: ox, y: oy },
        { x: tx, y: ty },
        { type: 'move', mode: 'any' }
      )) {
        return true;
      }
    }
  }
  return false;
}

async function moveAlongPath(
  startToken: FoundryToken,
  scene: { tokens: { get(id: string): FoundryToken | undefined } },
  path: Array<{ x: number; y: number }>,
  animate: boolean,
  finalUpdate?: TokenUpdateData
): Promise<FoundryToken> {
  const tokenId = startToken.id;
  let current = startToken;

  for (let i = 0; i < path.length; i++) {
    const waypoint = path[i];
    if (!waypoint) continue;

    const isLast = i === path.length - 1;
    const updateData: TokenUpdateData = { x: waypoint.x, y: waypoint.y };

    if (isLast && finalUpdate) {
      if (finalUpdate.elevation !== undefined) updateData.elevation = finalUpdate.elevation;
      if (finalUpdate.rotation !== undefined) updateData.rotation = finalUpdate.rotation;
    }

    const shouldAnimate = isLast && animate;
    await current.update(updateData, { animate: shouldAnimate });

    const refreshed = scene.tokens.get(tokenId);
    if (!refreshed) {
      throw new Error('Token lost during movement');
    }
    current = refreshed;
  }

  return current;
}

const DOOR_OPEN_DELAY = 400;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, ms); });
}

async function moveAlongPathWithDoors(
  startToken: FoundryToken,
  scene: FoundryScene,
  path: Array<{ x: number; y: number }>,
  animate: boolean,
  doorsOnPath: DoorOnPath[],
  finalUpdate?: TokenUpdateData
): Promise<{ token: FoundryToken; doorsOpened: string[] }> {
  const tokenId = startToken.id;
  let current = startToken;
  const doorsOpened: string[] = [];

  const doorsByStep = new Map<number, DoorOnPath[]>();
  for (const d of doorsOnPath) {
    const idx = d.betweenIndex - 1;
    const arr = doorsByStep.get(idx) ?? [];
    arr.push(d);
    doorsByStep.set(idx, arr);
  }

  for (let i = 0; i < path.length; i++) {
    const waypoint = path[i];
    if (!waypoint) continue;

    const hasDoor = doorsByStep.has(i);

    if (hasDoor && scene.walls) {
      const doors = doorsByStep.get(i);
      if (doors) {
        for (const door of doors) {
          const wall = scene.walls.get(door.wallId);
          if (wall && wall.door !== 0 && (wall.ds === 0 || wall.ds === undefined)) {
            await wall.update({ ds: 1 });
            doorsOpened.push(door.wallId);
            await delay(DOOR_OPEN_DELAY);
          }
        }
      }
    }

    const isLast = i === path.length - 1;
    const updateData: TokenUpdateData = { x: waypoint.x, y: waypoint.y };

    if (isLast && finalUpdate) {
      if (finalUpdate.elevation !== undefined) updateData.elevation = finalUpdate.elevation;
      if (finalUpdate.rotation !== undefined) updateData.rotation = finalUpdate.rotation;
    }

    if (hasDoor) {
      await current.update(updateData, { animate, teleport: true });
    } else {
      await current.update(updateData, { animate });
    }

    const refreshed = scene.tokens.get(tokenId);
    if (!refreshed) {
      throw new Error('Token lost during movement');
    }
    current = refreshed;
  }

  return { token: current, doorsOpened };
}

function extractWallInfos(scene: FoundryScene): WallInfo[] {
  if (!scene.walls) return [];
  return scene.walls.contents.map(w => ({
    id: w._id,
    c: w.c,
    door: w.door,
    ds: w.ds ?? 0,
    move: w.move
  }));
}

function getOpenableDoors(wallInfos: WallInfo[]): WallInfo[] {
  return wallInfos.filter(w => w.door === 1 && w.ds === 0 && w.move !== 0);
}

export async function moveTokenHandler(params: MoveTokenParams): Promise<TokenResult> {
  const scene = getActiveScene(game, params.sceneId);
  const token = getToken(scene, params.tokenId);
  const animate = params.animate !== false;

  const globals = getGlobals();
  const collisionBackend = globals.CONFIG?.Canvas?.polygonBackends?.move;
  const gridSize = globals.canvas?.scene?.grid?.size;

  if (collisionBackend && gridSize) {
    const tokenW = token.width;
    const tokenH = token.height;

    if (params.canOpenDoors && scene.walls) {
      return moveDoorAware(
        token, scene, params, animate, tokenW, tokenH, gridSize, collisionBackend
      );
    }

    const directBlocked = isDirectPathBlocked(
      token.x, token.y, params.x, params.y,
      tokenW, tokenH, gridSize, collisionBackend
    );

    if (directBlocked) {
      const pathResult = findGridPath({
        startX: token.x,
        startY: token.y,
        endX: params.x,
        endY: params.y,
        gridSize,
        collision: collisionBackend,
        tokenWidth: tokenW,
        tokenHeight: tokenH
      });

      if (!pathResult || pathResult.path.length === 0) {
        throw new Error('Path blocked — no valid route to destination');
      }

      const finalUpdate: TokenUpdateData = {};
      if (params.elevation !== undefined) finalUpdate.elevation = params.elevation;
      if (params.rotation !== undefined) finalUpdate.rotation = params.rotation;

      const moved = await moveAlongPath(token, scene, pathResult.path, animate, finalUpdate);
      const tokenResult = mapTokenToResult(moved);
      tokenResult.pathCost = pathResult.cost;
      return tokenResult;
    }
  }

  const updateData: TokenUpdateData = {
    x: params.x,
    y: params.y
  };

  if (params.elevation !== undefined) {
    updateData.elevation = params.elevation;
  }
  if (params.rotation !== undefined) {
    updateData.rotation = params.rotation;
  }

  const updated = await token.update(updateData, { animate });
  return mapTokenToResult(updated);
}

async function moveDoorAware(
  token: FoundryToken,
  scene: FoundryScene,
  params: MoveTokenParams,
  animate: boolean,
  tokenW: number,
  tokenH: number,
  gridSize: number,
  collisionBackend: CollisionChecker
): Promise<TokenResult> {
  const wallInfos = extractWallInfos(scene);
  const doorAware = createDoorAwareCollision(collisionBackend, wallInfos);
  const openableDoors = getOpenableDoors(wallInfos);

  const finalUpdate: TokenUpdateData = {};
  if (params.elevation !== undefined) finalUpdate.elevation = params.elevation;
  if (params.rotation !== undefined) finalUpdate.rotation = params.rotation;

  const directBlocked = isDirectPathBlocked(
    token.x, token.y, params.x, params.y,
    tokenW, tokenH, gridSize, doorAware.collision
  );

  if (!directBlocked) {
    const doorsOnDirect = findDoorsAlongPath(
      [{ x: params.x, y: params.y }], token.x, token.y, gridSize, openableDoors
    );

    if (doorsOnDirect.length > 0) {
      const { token: moved, doorsOpened } = await moveAlongPathWithDoors(
        token, scene, [{ x: params.x, y: params.y }], animate, doorsOnDirect, finalUpdate
      );
      const result = mapTokenToResult(moved);
      if (doorsOpened.length > 0) result.doorsOpened = doorsOpened;
      return result;
    }

    const updateData: TokenUpdateData = { x: params.x, y: params.y, ...finalUpdate };
    const updated = await token.update(updateData, { animate });
    return mapTokenToResult(updated);
  }

  const pathResult = findGridPath({
    startX: token.x,
    startY: token.y,
    endX: params.x,
    endY: params.y,
    gridSize,
    collision: doorAware.collision,
    tokenWidth: tokenW,
    tokenHeight: tokenH
  });

  if (!pathResult || pathResult.path.length === 0) {
    throw new Error('Path blocked — no valid route to destination');
  }

  const doorsOnPath = findDoorsAlongPath(
    pathResult.path, token.x, token.y, gridSize, openableDoors
  );

  const { token: moved, doorsOpened } = await moveAlongPathWithDoors(
    token, scene, pathResult.path, animate, doorsOnPath, finalUpdate
  );
  const result = mapTokenToResult(moved);
  result.pathCost = pathResult.cost;
  if (doorsOpened.length > 0) result.doorsOpened = doorsOpened;
  return result;
}
