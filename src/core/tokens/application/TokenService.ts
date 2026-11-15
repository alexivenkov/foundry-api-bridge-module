import { requireScene, type SceneIdentity, type SceneLocator } from '@/core/shared';
import {
  ActorTokenNotFoundError,
  TokenCreationFailedError,
  TokenNotFoundError,
  chebyshevDistanceFromPoint,
  hasChanges,
  type SceneGridReader,
  type Token,
  type TokenStore
} from '@/core/tokens/domain';
import type {
  CreateTokenCommand,
  DeleteTokenCommand,
  GetTokenByActorQuery,
  GetTokenQuery,
  ListTokensQuery,
  TokensInRangeQuery,
  UpdateTokenCommand
} from './commands';

const DEFAULT_GRID_SIZE = 100;
const DEFAULT_GRID_DISTANCE = 5;
const DEFAULT_GRID_UNITS = 'ft';

export interface TokenServiceDependencies {
  readonly scenes: SceneLocator;
  readonly tokens: TokenStore;
  readonly grids: SceneGridReader;
}

export interface TokenListResult {
  readonly scene: SceneIdentity;
  readonly tokens: readonly Token[];
}

export interface TokenInScene {
  readonly sceneId: string;
  readonly token: Token;
}

export interface TokenAtDistance {
  readonly token: Token;
  /** In the scene's distance units. */
  readonly distance: number;
}

export interface TokensInRangeResult {
  readonly sceneId: string;
  readonly units: string;
  readonly tokens: readonly TokenAtDistance[];
}

export class TokenService {
  constructor(private readonly deps: TokenServiceDependencies) {}

  listTokens(query: ListTokensQuery): TokenListResult {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { scene, tokens: this.deps.tokens.listTokens(scene.id) };
  }

  getToken(query: GetTokenQuery): TokenInScene {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, token: this.requireToken(scene.id, query.tokenId) };
  }

  /** The first token placed for the actor on the scene. */
  getTokenByActor(query: GetTokenByActorQuery): TokenInScene {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    const token = this.deps.tokens.listTokens(scene.id).find((candidate) => candidate.actorId === query.actorId);
    if (token === undefined) {
      throw new ActorTokenNotFoundError(query.actorId, scene.id);
    }
    return { sceneId: scene.id, token };
  }

  /**
   * Tokens whose footprint lies within `range` of a point, nearest first.
   * Distance is Chebyshev over the square grid; walls and elevation are ignored.
   */
  tokensInRange(query: TokensInRangeQuery): TokensInRangeResult {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    const grid = this.deps.grids.readGrid(scene.id);
    const gridSize = grid.size ?? DEFAULT_GRID_SIZE;
    const gridDistance = grid.distance ?? DEFAULT_GRID_DISTANCE;

    const tokens = this.deps.tokens
      .listTokens(scene.id)
      .filter((token) => token.id !== query.excludeTokenId)
      .map((token) => ({
        token,
        distance: chebyshevDistanceFromPoint(query.originX, query.originY, token, gridSize, gridDistance)
      }))
      .filter((entry) => entry.distance <= query.range)
      .sort((a, b) => a.distance - b.distance);

    return { sceneId: scene.id, units: grid.units ?? DEFAULT_GRID_UNITS, tokens };
  }

  async createToken(command: CreateTokenCommand): Promise<Token> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const token = await this.deps.tokens.createToken(scene.id, command.draft);
    if (token === null) {
      throw new TokenCreationFailedError();
    }
    return token;
  }

  async updateToken(command: UpdateTokenCommand): Promise<Token> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const token = this.requireToken(scene.id, command.tokenId);
    if (!hasChanges(command.changes)) {
      return token;
    }
    const updated = await this.deps.tokens.updateToken(scene.id, token.id, command.changes);
    if (updated === null) {
      throw new TokenNotFoundError(command.tokenId);
    }
    return updated;
  }

  async deleteToken(command: DeleteTokenCommand): Promise<void> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const token = this.requireToken(scene.id, command.tokenId);
    await this.deps.tokens.deleteToken(scene.id, token.id);
  }

  private requireToken(sceneId: string, tokenId: string): Token {
    const token = this.deps.tokens.findToken(sceneId, tokenId);
    if (token === null) {
      throw new TokenNotFoundError(tokenId);
    }
    return token;
  }
}
