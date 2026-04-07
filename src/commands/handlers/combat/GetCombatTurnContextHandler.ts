import type {
  GetCombatTurnContextParams,
  CombatTurnContext,
  TurnCombatantInfo,
  NearbyTokenInfo
} from '@/commands/types';
import { generateAsciiMap, type AsciiMapInput } from '@/commands/handlers/scene/AsciiMapGenerator';

interface SceneToken {
  id: string;
  name: string | undefined;
  x: number;
  y: number;
  width: number | undefined;
  height: number | undefined;
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

interface SceneWall {
  c: number[];
  door: number;
  ds: number | undefined;
  move: number;
}

interface SceneGrid {
  size: number | undefined;
  distance: number | undefined;
  units: string | undefined;
}

interface FoundryCombatant {
  id: string;
  actorId: string;
  tokenId: string | null;
  name: string;
}

interface FoundryCombat {
  id: string;
  round: number;
  turn: number;
  combatant: FoundryCombatant | null;
  combatants: {
    contents: FoundryCombatant[];
  };
}

interface CollisionChecker {
  testCollision(
    origin: { x: number; y: number },
    destination: { x: number; y: number },
    config: { type: string; mode: string }
  ): boolean;
}

interface FoundryGame {
  combat: FoundryCombat | null;
  combats: {
    get(id: string): FoundryCombat | undefined;
  };
}

interface ContextGlobals {
  game: FoundryGame;
  canvas?: {
    scene?: {
      name: string;
      grid: SceneGrid;
      tokens: { contents: SceneToken[] };
      walls: { contents: SceneWall[] };
    };
  };
  CONFIG?: {
    Canvas?: {
      polygonBackends?: {
        move?: CollisionChecker;
        sight?: CollisionChecker;
      };
    };
  };
}

const ZOOM_RADIUS = 12;

const DISPOSITIONS: Record<number, string> = {
  [-1]: 'hostile',
  [0]: 'neutral',
  [1]: 'friendly'
};

function getGlobals(): ContextGlobals {
  return globalThis as unknown as ContextGlobals;
}

function getActiveCombat(globals: ContextGlobals, combatId?: string): FoundryCombat {
  if (combatId) {
    const combat = globals.game.combats.get(combatId);
    if (!combat) throw new Error(`Combat not found: ${combatId}`);
    return combat;
  }
  const combat = globals.game.combat;
  if (!combat) throw new Error('No active combat');
  return combat;
}

function chebyshevDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function getCombatTurnContextHandler(
  params: GetCombatTurnContextParams
): Promise<CombatTurnContext> {
  try {
    const globals = getGlobals();
    const combat = getActiveCombat(globals, params.combatId);

    const currentCombatant = combat.combatant;
    if (!currentCombatant) {
      throw new Error('No current combatant');
    }

    if (!currentCombatant.tokenId) {
      throw new Error('Current combatant has no token');
    }

    const scene = globals.canvas?.scene;
    if (!scene) {
      throw new Error('No active scene');
    }

    const gridSize = scene.grid.size ?? 100;
    const gridDistance = scene.grid.distance ?? 5;
    const gridUnits = scene.grid.units ?? 'ft';

    const currentToken = scene.tokens.contents.find(t => t.id === currentCombatant.tokenId);
    if (!currentToken) {
      throw new Error(`Token not found for current combatant: ${currentCombatant.tokenId}`);
    }

    const currentGridX = Math.floor(currentToken.x / gridSize);
    const currentGridY = Math.floor(currentToken.y / gridSize);
    const currentCenterX = currentToken.x + gridSize / 2;
    const currentCenterY = currentToken.y + gridSize / 2;

    const currentHp = currentToken.actor?.system?.attributes?.hp;
    const currentAc = currentToken.actor?.system?.attributes?.ac;

    const currentInfo: TurnCombatantInfo = {
      id: currentCombatant.id,
      actorId: currentCombatant.actorId,
      tokenId: currentCombatant.tokenId,
      name: currentCombatant.name,
      gridX: currentGridX,
      gridY: currentGridY,
      conditions: currentToken.actor?.statuses ? [...currentToken.actor.statuses] : []
    };

    if (currentHp) currentInfo.hp = { value: currentHp.value, max: currentHp.max };
    if (currentAc) currentInfo.ac = currentAc.value;

    const combatantTokenIds = new Set<string>();
    for (const c of combat.combatants.contents) {
      if (c.tokenId) combatantTokenIds.add(c.tokenId);
    }

    const sightBackend = globals.CONFIG?.Canvas?.polygonBackends?.sight;
    const moveBackend = globals.CONFIG?.Canvas?.polygonBackends?.move;

    const nearbyTokens: NearbyTokenInfo[] = [];

    for (const token of scene.tokens.contents) {
      if (token.id === currentCombatant.tokenId) continue;
      if (!combatantTokenIds.has(token.id)) continue;

      const tokenGridX = Math.floor(token.x / gridSize);
      const tokenGridY = Math.floor(token.y / gridSize);
      const gridDist = chebyshevDistance(currentGridX, currentGridY, tokenGridX, tokenGridY);
      const distanceFt = gridDist * gridDistance;

      let lineOfSight = true;
      if (sightBackend) {
        const targetCenterX = token.x + gridSize / 2;
        const targetCenterY = token.y + gridSize / 2;
        lineOfSight = !sightBackend.testCollision(
          { x: currentCenterX, y: currentCenterY },
          { x: targetCenterX, y: targetCenterY },
          { type: 'sight', mode: 'any' }
        );
      }

      const tokenHp = token.actor?.system?.attributes?.hp;
      const tokenAc = token.actor?.system?.attributes?.ac;

      const info: NearbyTokenInfo = {
        tokenId: token.id,
        actorId: token.actor?.id ?? null,
        name: token.name ?? '',
        gridX: tokenGridX,
        gridY: tokenGridY,
        distanceFt,
        disposition: DISPOSITIONS[token.disposition ?? 0] ?? 'neutral',
        lineOfSight,
        conditions: token.actor?.statuses ? [...token.actor.statuses] : []
      };

      if (tokenHp) info.hp = { value: tokenHp.value, max: tokenHp.max };
      if (tokenAc) info.ac = tokenAc.value;

      nearbyTokens.push(info);
    }

    nearbyTokens.sort((a, b) => a.distanceFt - b.distanceFt);

    const walls = scene.walls.contents.map(w => ({
      c: w.c,
      door: w.door,
      ds: w.ds ?? 0,
      move: w.move
    }));

    const mapTokens = scene.tokens.contents
      .filter(t => combatantTokenIds.has(t.id))
      .map(t => ({
        id: t.id,
        name: t.name ?? '',
        x: t.x,
        y: t.y,
        width: t.width ?? 1,
        height: t.height ?? 1,
        hp: t.actor?.system?.attributes?.hp
      }));

    const mapInput: AsciiMapInput = {
      gridSize,
      gridDistance,
      gridUnits,
      sceneName: scene.name,
      tokens: mapTokens,
      walls,
      collisionBackend: moveBackend,
      center: { gx: currentGridX, gy: currentGridY },
      radius: ZOOM_RADIUS
    };

    const asciiMap = generateAsciiMap(mapInput);

    return Promise.resolve({
      round: combat.round,
      turn: combat.turn,
      currentCombatant: currentInfo,
      nearbyTokens,
      asciiMap
    });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
