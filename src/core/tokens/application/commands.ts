import type {
  CoreMovementOptions,
  CoreMovementWaypoint,
  PrototypeTokenChangesRequest,
  SpeechBubbleOptions,
  TokenChanges,
  TokenChangesRequest,
  TokenDraft,
  TokenDraftRequest
} from '@/core/tokens/domain';

export interface ListTokensQuery {
  readonly sceneId: string | undefined;
}

export interface GetTokenQuery {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
}

export interface GetTokenByActorQuery {
  readonly sceneId: string | undefined;
  readonly actorId: string;
}

export interface TokensInRangeQuery {
  readonly sceneId: string | undefined;
  readonly originX: number;
  readonly originY: number;
  readonly range: number;
  readonly excludeTokenId: string | undefined;
}

export interface CreateTokenCommand {
  readonly sceneId: string | undefined;
  readonly draft: TokenDraft;
}

export interface UpdateTokenCommand {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
  readonly changes: TokenChanges;
}

export interface DeleteTokenCommand {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
}

export interface MoveTokenCommand {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
  readonly x: number;
  readonly y: number;
  readonly elevation: number | undefined;
  readonly rotation: number | undefined;
  readonly animate: boolean;
  readonly canOpenDoors: boolean;
}

export interface SetTokenTargetCommand {
  readonly tokenId: string;
  readonly targeted: boolean;
  readonly releaseOthers: boolean;
}

export interface CreateTokenWithAppearanceCommand {
  readonly sceneId: string | undefined;
  readonly draft: TokenDraftRequest;
  /** Build the token from the actor's prototype token. */
  readonly fromPrototype: boolean;
  readonly includeAppearance: boolean;
}

export interface UpdateTokenWithAppearanceCommand {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
  readonly changes: TokenChangesRequest;
  readonly includeAppearance: boolean;
}

export interface GetTokenAppearanceQuery {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
}

export interface PrototypeTokenQuery {
  readonly actorId: string;
}

export interface UpdatePrototypeTokenCommand {
  readonly actorId: string;
  readonly changes: PrototypeTokenChangesRequest;
}

export interface TokenMovementQuery {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
}

export interface MoveTokenPathCommand extends TokenMovementQuery {
  readonly waypoints: readonly CoreMovementWaypoint[];
  readonly options: CoreMovementOptions;
}

export interface PauseTokenMovementCommand extends TokenMovementQuery {
  readonly key: string;
}

export interface ResumeTokenMovementCommand extends TokenMovementQuery {
  /** undefined = the token's current movement. */
  readonly movementId: string | undefined;
  readonly key: string;
}

export interface MeasureTokenPathQuery extends TokenMovementQuery {
  readonly waypoints: readonly CoreMovementWaypoint[];
}

export interface FindTokenPathQuery extends TokenMovementQuery {
  readonly waypoints: readonly CoreMovementWaypoint[];
  readonly options: Pick<CoreMovementOptions, 'ignoreWalls' | 'ignoreCost'>;
}

export interface RevertTokenMovementCommand extends TokenMovementQuery {
  /** undefined = the last recorded movement. */
  readonly movementId: string | undefined;
}

export interface ClearMovementHistoryCommand {
  readonly sceneId: string | undefined;
  readonly tokenId: string | undefined;
  readonly combatId: string | undefined;
}

export interface SelectTokensCommand {
  readonly tokenIds: readonly string[];
  readonly releaseOthers: boolean;
}

export interface SetTargetsCommand {
  readonly tokenIds: readonly string[];
}

export interface ShowSpeechBubbleCommand {
  readonly sceneId: string | undefined;
  readonly tokenId: string;
  readonly text: string;
  readonly options: SpeechBubbleOptions;
}
