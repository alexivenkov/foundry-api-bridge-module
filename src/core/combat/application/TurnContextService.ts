import { generateAsciiMap, type AsciiMapInput } from '@/core/shared';
import {
  CurrentCombatantHasNoTokenError,
  CurrentCombatantTokenNotFoundError,
  NoBattlefieldError,
  NoCurrentCombatantError,
  TURN_MAP_RADIUS,
  cellOf,
  participantTokenIds,
  participantTokens,
  surveyNearbyTokens,
  type Battlefield,
  type BattlefieldReader,
  type BattlefieldToken,
  type CanvasCollisions,
  type CombatLocator,
  type Combatant,
  type GridCell,
  type MapCollisionTest,
  type NearbyToken,
  type TurnReader
} from '@/core/combat/domain';
import type { CombatAddress } from './commands';
import { requireCombat } from './requireCombat';

export interface TurnContextServiceDependencies {
  readonly combats: CombatLocator;
  readonly turns: TurnReader;
  readonly battlefield: BattlefieldReader;
  readonly collisions: CanvasCollisions;
}

export interface TurnContext {
  readonly round: number;
  readonly turn: number;
  readonly current: {
    readonly combatant: Combatant;
    readonly token: BattlefieldToken;
    readonly cell: GridCell;
  };
  /** The other participants on the scene, nearest first. */
  readonly nearby: readonly NearbyToken[];
  readonly asciiMap: string;
}

function toMapInput(
  battlefield: Battlefield,
  tokens: readonly BattlefieldToken[],
  center: GridCell,
  movementTest: MapCollisionTest | undefined
): AsciiMapInput {
  return {
    gridSize: battlefield.grid.size,
    gridDistance: battlefield.grid.distance,
    gridUnits: battlefield.grid.units,
    sceneName: battlefield.sceneName,
    tokens: tokens.map((token) => ({
      id: token.id,
      name: token.name,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      hp: token.vitals.hp ?? undefined
    })),
    walls: battlefield.walls.map((wall) => ({
      c: [...wall.coordinates],
      door: wall.door,
      ds: wall.doorState,
      move: wall.movement
    })),
    collisionBackend: movementTest,
    center: { gx: center.column, gy: center.row },
    radius: TURN_MAP_RADIUS
  };
}

export class TurnContextService {
  constructor(private readonly deps: TurnContextServiceDependencies) {}

  /**
   * What the combatant whose turn it is has around it, on the scene its token
   * is on. Sight lines and the walls of the map come from the canvas, which
   * only knows the scene this client views: for any other scene every token
   * counts as visible and no map is drawn.
   */
  describeTurn(query: CombatAddress): TurnContext {
    const combat = requireCombat(this.deps.combats, query.combatId);
    const overview = this.deps.turns.readTurn(combat.id);

    const combatant = overview.current;
    if (combatant === null) {
      throw new NoCurrentCombatantError();
    }
    const tokenId = combatant.tokenId;
    if (!tokenId) {
      throw new CurrentCombatantHasNoTokenError();
    }

    const battlefield = this.findBattlefield(overview.currentSceneId);
    if (battlefield === null) {
      throw new NoBattlefieldError();
    }
    const token = battlefield.tokens.find((candidate) => candidate.id === tokenId);
    if (token === undefined) {
      throw new CurrentCombatantTokenNotFoundError(tokenId);
    }

    const cell = cellOf(token, battlefield.grid.size);
    const participants = participantTokenIds(overview.combatants);

    return {
      round: overview.round,
      turn: overview.turn,
      current: { combatant, token, cell },
      nearby: surveyNearbyTokens({
        current: token,
        tokens: battlefield.tokens,
        participantTokenIds: participants,
        grid: battlefield.grid,
        sightTest: battlefield.onCanvas ? this.deps.collisions.sightTest() : undefined
      }),
      asciiMap: generateAsciiMap(
        toMapInput(
          battlefield,
          participantTokens(battlefield.tokens, participants),
          cell,
          battlefield.onCanvas ? this.deps.collisions.movementTest() : undefined
        )
      )
    };
  }

  /** The scene the current combatant's token is on; when that is not known, the scene this client views. */
  private findBattlefield(sceneId: string | null): Battlefield | null {
    const scene = sceneId !== null ? this.deps.battlefield.readScene(sceneId) : null;
    return scene ?? this.deps.battlefield.readViewedScene();
  }
}
