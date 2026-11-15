import { readConventionalVitals } from '@/core/shared';
import type {
  Battlefield,
  BattlefieldDisposition,
  BattlefieldToken,
  BattlefieldWall
} from '@/core/combat/domain';
import type {
  FoundryBattlefieldScene,
  FoundryBattlefieldToken,
  FoundryBattlefieldWall
} from './foundryBattlefieldTypes';

const DEFAULT_GRID_SIZE = 100;
const DEFAULT_GRID_DISTANCE = 5;
const DEFAULT_GRID_UNITS = 'ft';

// CONST.TOKEN_DISPOSITIONS, verified against Foundry 13.351 and 14.368.
const DISPOSITION_BY_CODE: Readonly<Record<number, BattlefieldDisposition>> = {
  [-2]: 'secret',
  [-1]: 'hostile',
  0: 'neutral',
  1: 'friendly'
};

function toBattlefieldToken(token: FoundryBattlefieldToken): BattlefieldToken {
  return {
    id: token.id,
    name: token.name ?? '',
    x: token.x,
    y: token.y,
    width: token.width ?? 1,
    height: token.height ?? 1,
    disposition: DISPOSITION_BY_CODE[token.disposition ?? 0] ?? 'neutral',
    actorId: token.actor?.id ?? null,
    statuses: token.actor?.statuses ? [...token.actor.statuses] : [],
    vitals: readConventionalVitals(token.actor)
  };
}

function toBattlefieldWall(wall: FoundryBattlefieldWall): BattlefieldWall {
  return { coordinates: wall.c, door: wall.door, doorState: wall.ds ?? 0, movement: wall.move };
}

export function toBattlefield(scene: FoundryBattlefieldScene, onCanvas: boolean): Battlefield {
  return {
    sceneName: scene.name,
    onCanvas,
    grid: {
      size: scene.grid.size ?? DEFAULT_GRID_SIZE,
      distance: scene.grid.distance ?? DEFAULT_GRID_DISTANCE,
      units: scene.grid.units ?? DEFAULT_GRID_UNITS
    },
    tokens: scene.tokens.contents.map(toBattlefieldToken),
    walls: scene.walls.contents.map(toBattlefieldWall)
  };
}
