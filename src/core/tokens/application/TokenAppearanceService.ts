import { ActorNotFoundError, requireActor, requireScene, type ActorLocator, type SceneLocator } from '@/core/shared';
import {
  NEW_TOKEN_LIGHT,
  PrototypeTokenUpdateFailedError,
  TokenCreationFailedError,
  TokenNotFoundError,
  assertScaleWithoutTextureScale,
  assertTokenAppearance,
  resolveSightRequest,
  type ActorTokenIndex,
  type ActorTokenPlacement,
  type PrototypeToken,
  type PrototypeTokenStore,
  type Token,
  type TokenAppearance,
  type TokenAppearanceDetail,
  type TokenAppearanceEnvironment,
  type TokenAppearanceReader,
  type TokenChanges,
  type TokenDraft,
  type TokenLightState,
  type TokenSightRequest
} from '@/core/tokens/domain';
import type {
  CreateTokenWithAppearanceCommand,
  GetTokenAppearanceQuery,
  PrototypeTokenQuery,
  UpdatePrototypeTokenCommand,
  UpdateTokenWithAppearanceCommand
} from './commands';
import type { TokenService } from './TokenService';

export interface TokenAppearanceServiceDependencies {
  readonly scenes: SceneLocator;
  readonly actors: ActorLocator;
  /** Writes plain token changes and owns the scene and token lookups of those writes. */
  readonly tokens: TokenService;
  readonly appearance: TokenAppearanceReader;
  readonly environment: TokenAppearanceEnvironment;
  readonly prototypes: PrototypeTokenStore;
  readonly actorTokens: ActorTokenIndex;
}

export interface TokenWithAppearance {
  readonly sceneId: string;
  readonly token: Token;
  /** null when it was not asked for, or cannot be read. */
  readonly appearance: TokenAppearanceDetail | null;
}

export interface ActorTokensResult {
  readonly actorId: string;
  readonly tokens: readonly ActorTokenPlacement[];
}

export interface TokenImagesResult {
  readonly actorId: string;
  readonly randomImg: boolean;
  readonly images: readonly string[];
}

function lightStateOf(appearance: TokenAppearance): TokenLightState {
  return { negative: appearance.light.negative ?? false, darkness: appearance.light.darkness };
}

/**
 * Token appearance, senses and prototypes: the checks a change goes through
 * (Foundry generation, registry ids, ranges the core would clamp) and the
 * writes that follow.
 */
export class TokenAppearanceService {
  constructor(private readonly deps: TokenAppearanceServiceDependencies) {}

  async createToken(command: CreateTokenWithAppearanceCommand): Promise<TokenWithAppearance> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const draft: TokenDraft = { ...command.draft, sight: this.resolveSight(command.draft.sight) };
    assertScaleWithoutTextureScale(draft.scale, draft.texture);

    if (!command.fromPrototype) {
      assertTokenAppearance(draft, NEW_TOKEN_LIGHT, this.deps.environment);
      const token = await this.deps.tokens.createToken({ sceneId: scene.id, draft });
      return this.withAppearance(scene.id, token, command.includeAppearance);
    }

    const prototype = this.requirePrototype(draft.actorId);
    assertTokenAppearance(draft, lightStateOf(prototype), this.deps.environment);
    const token = await this.deps.prototypes.createFromPrototype(scene.id, draft);
    if (token === null) {
      throw new TokenCreationFailedError();
    }
    return this.withAppearance(scene.id, token, command.includeAppearance);
  }

  async updateToken(command: UpdateTokenWithAppearanceCommand): Promise<TokenWithAppearance> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const changes: TokenChanges = { ...command.changes, sight: this.resolveSight(command.changes.sight) };
    assertScaleWithoutTextureScale(changes.scale, changes.texture);
    const light = changes.light !== undefined ? this.currentLight(scene.id, command.tokenId) : NEW_TOKEN_LIGHT;
    assertTokenAppearance(changes, light, this.deps.environment);
    const token = await this.deps.tokens.updateToken({ sceneId: scene.id, tokenId: command.tokenId, changes });
    return this.withAppearance(scene.id, token, command.includeAppearance);
  }

  /** The appearance of one token; null when the token cannot report one. */
  getAppearance(query: GetTokenAppearanceQuery): TokenAppearanceDetail | null {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return this.deps.appearance.findAppearance(scene.id, query.tokenId);
  }

  getPrototype(query: PrototypeTokenQuery): PrototypeToken {
    return this.requirePrototype(query.actorId);
  }

  async updatePrototype(command: UpdatePrototypeTokenCommand): Promise<PrototypeToken> {
    const current = this.requirePrototype(command.actorId);
    const changes = { ...command.changes, sight: this.resolveSight(command.changes.sight) };
    assertTokenAppearance(changes, lightStateOf(current), this.deps.environment);
    const updated = await this.deps.prototypes.updatePrototype(command.actorId, changes);
    if (updated === null) {
      throw new PrototypeTokenUpdateFailedError(command.actorId);
    }
    return updated;
  }

  async getTokenImages(query: PrototypeTokenQuery): Promise<TokenImagesResult> {
    const prototype = this.requirePrototype(query.actorId);
    const images = await this.deps.prototypes.tokenImages(query.actorId);
    return { actorId: query.actorId, randomImg: prototype.randomImg, images };
  }

  listActorTokens(query: PrototypeTokenQuery): ActorTokensResult {
    const actor = requireActor(this.deps.scenes, this.deps.actors, { kind: 'actor', actorId: query.actorId });
    return { actorId: actor.id, tokens: this.deps.actorTokens.listActorTokens(actor.id) };
  }

  private resolveSight(sight: TokenSightRequest | undefined): TokenChanges['sight'] {
    return resolveSightRequest(sight, (visionMode) => this.deps.environment.visionModeDefaults(visionMode));
  }

  private requirePrototype(actorId: string): PrototypeToken {
    const actor = requireActor(this.deps.scenes, this.deps.actors, { kind: 'actor', actorId });
    const prototype = this.deps.prototypes.findPrototype(actor.id);
    if (prototype === null) {
      throw new ActorNotFoundError(actorId);
    }
    return prototype;
  }

  private currentLight(sceneId: string, tokenId: string): TokenLightState {
    const appearance = this.deps.appearance.findAppearance(sceneId, tokenId);
    if (appearance === null) {
      throw new TokenNotFoundError(tokenId);
    }
    return lightStateOf(appearance);
  }

  private withAppearance(sceneId: string, token: Token, include: boolean): TokenWithAppearance {
    return {
      sceneId,
      token,
      appearance: include ? this.deps.appearance.findAppearance(sceneId, token.id) : null
    };
  }
}
