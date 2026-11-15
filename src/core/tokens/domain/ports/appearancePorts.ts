import type { Token, TokenDraft } from '@/core/tokens/domain/model/Token';
import type { TokenAppearanceDetail, TokenSightChanges } from '@/core/tokens/domain/model/TokenAppearance';
import type {
  ActorTokenPlacement,
  PrototypeToken,
  PrototypeTokenChanges
} from '@/core/tokens/domain/model/PrototypeToken';

export interface TokenAppearanceReader {
  findAppearance(sceneId: string, tokenId: string): TokenAppearanceDetail | null;
}

/** What the running Foundry generation stores on a token. */
export interface TokenFeatures {
  /** `ring` (Foundry 12+). */
  readonly ring: boolean;
  /** Light `negative` and `priority` (Foundry 12+). */
  readonly darknessSources: boolean;
  /** `shape`, `turnMarker`, `movementAction` (Foundry 13+). */
  readonly movement: boolean;
  /** `depth` and the attenuation colorations (Foundry 14+). */
  readonly depth: boolean;
  /** `texture.offsetX`, `texture.offsetY`, `texture.rotation` (Foundry 13 and older). */
  readonly textureOffset: boolean;
}

export type TokenLightKind = 'light' | 'darkness';

/** The running world's registries; a registry reads null when it cannot be read. */
export interface TokenAppearanceEnvironment {
  features(): TokenFeatures;
  lightAnimations(kind: TokenLightKind): readonly string[] | null;
  visionModes(): readonly string[] | null;
  /** The sight values a vision mode sets when it is picked on the token sheet. */
  visionModeDefaults(visionMode: string): TokenSightChanges;
  detectionModes(): readonly string[] | null;
  movementActions(): readonly string[] | null;
  turnMarkerAnimations(): readonly string[] | null;
}

/** World actors' prototype tokens, and tokens placed from them. */
export interface PrototypeTokenStore {
  findPrototype(actorId: string): PrototypeToken | null;
  updatePrototype(actorId: string, changes: PrototypeTokenChanges): Promise<PrototypeToken | null>;
  /** The images the wildcard path of the prototype matches (`Actor#getTokenImages`). */
  tokenImages(actorId: string): Promise<readonly string[]>;
  /** Places a token built from the prototype (`Actor#getTokenDocument`) with the draft on top; null when nothing was created. */
  createFromPrototype(sceneId: string, draft: TokenDraft): Promise<Token | null>;
}

export interface ActorTokenIndex {
  /** Every token placed for the actor, on every scene. */
  listActorTokens(actorId: string): readonly ActorTokenPlacement[];
}
