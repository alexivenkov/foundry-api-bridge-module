import { requireScene, type SceneLocator } from '@/core/shared';
import {
  PathBlockedError,
  TokenLostError,
  TokenNotFoundError,
  planMovement,
  type DoorOnPath,
  type MovementPlan,
  type MovementSurface,
  type Passages,
  type PlacementOptions,
  type Point,
  type Token,
  type TokenPlacement,
  type TokenStore
} from '@/core/tokens/domain';
import type { MoveTokenCommand } from './commands';

export interface TokenMovementServiceDependencies {
  readonly scenes: SceneLocator;
  readonly tokens: TokenStore;
  readonly surface: MovementSurface;
  readonly passages: Passages;
}

export interface TokenMovementResult {
  readonly token: Token;
  /** Cells walked, when the token had to go around obstacles. */
  readonly pathCost?: number;
  /** Doors the token opened on its way. */
  readonly doorsOpened?: readonly string[];
}

interface Journey {
  readonly sceneId: string;
  readonly tokenId: string;
  readonly command: MoveTokenCommand;
}

export class TokenMovementService {
  constructor(private readonly deps: TokenMovementServiceDependencies) {}

  async moveToken(command: MoveTokenCommand): Promise<TokenMovementResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const token = this.deps.tokens.findToken(scene.id, command.tokenId);
    if (token === null) {
      throw new TokenNotFoundError(command.tokenId);
    }

    const journey: Journey = { sceneId: scene.id, tokenId: token.id, command };
    const plan = this.plan(scene.id, token, command);

    switch (plan.kind) {
      case 'blocked':
        throw new PathBlockedError();
      case 'direct':
        return { token: await this.place(journey, command, true, { animate: command.animate, throughDoor: false }) };
      case 'path':
        return { token: await this.walk(journey, plan.steps), pathCost: plan.pathCost };
      case 'doors':
        return this.walkThroughDoors(journey, plan.steps, plan.doors, plan.pathCost);
    }
  }

  private plan(sceneId: string, token: Token, command: MoveTokenCommand): MovementPlan {
    const surface = this.deps.surface.probe();
    if (surface === null) {
      return { kind: 'direct' };
    }
    return planMovement({
      from: { x: token.x, y: token.y },
      to: { x: command.x, y: command.y },
      width: token.width,
      height: token.height,
      gridSize: surface.gridSize,
      collision: surface.collision,
      walls: command.canOpenDoors ? this.deps.passages.listWalls(sceneId) : null
    });
  }

  /** Walks a route cell by cell; only the last step is animated. */
  private async walk(journey: Journey, steps: readonly Point[]): Promise<Token> {
    let current: Token | undefined;
    for (const [index, step] of steps.entries()) {
      const isLast = index === steps.length - 1;
      current = await this.place(journey, step, isLast, {
        animate: isLast && journey.command.animate,
        throughDoor: false
      });
    }
    return this.arrived(current);
  }

  /** Walks a route, opening each door right before the step that crosses it. */
  private async walkThroughDoors(
    journey: Journey,
    steps: readonly Point[],
    doors: readonly DoorOnPath[],
    pathCost: number | undefined
  ): Promise<TokenMovementResult> {
    const doorsOpened: string[] = [];
    let current: Token | undefined;

    for (const [index, step] of steps.entries()) {
      const doorsHere = doors.filter((door) => door.betweenIndex - 1 === index);
      for (const door of doorsHere) {
        if (await this.deps.passages.openDoor(journey.sceneId, door.wallId)) {
          doorsOpened.push(door.wallId);
        }
      }
      current = await this.place(journey, step, index === steps.length - 1, {
        animate: journey.command.animate,
        throughDoor: doorsHere.length > 0
      });
    }

    return {
      token: this.arrived(current),
      ...(pathCost !== undefined ? { pathCost } : {}),
      ...(doorsOpened.length > 0 ? { doorsOpened } : {})
    };
  }

  /** Elevation and rotation are applied with the step that reaches the destination. */
  private async place(journey: Journey, point: Point, isLast: boolean, options: PlacementOptions): Promise<Token> {
    const { elevation, rotation } = journey.command;
    const placement: TokenPlacement = {
      x: point.x,
      y: point.y,
      ...(isLast && elevation !== undefined ? { elevation } : {}),
      ...(isLast && rotation !== undefined ? { rotation } : {})
    };
    const placed = await this.deps.tokens.placeToken(journey.sceneId, journey.tokenId, placement, options);
    return this.arrived(placed ?? undefined);
  }

  private arrived(token: Token | undefined): Token {
    if (token === undefined) {
      throw new TokenLostError();
    }
    return token;
  }
}
