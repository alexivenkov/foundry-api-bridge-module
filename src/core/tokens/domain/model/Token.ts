import type { ActorVitals } from '@/core/shared/domain';
import type {
  TokenAppearanceChanges,
  TokenAppearanceRequest,
  TokenShape
} from '@/core/tokens/domain/model/TokenAppearance';

export const TOKEN_DISPOSITIONS = ['secret', 'hostile', 'neutral', 'friendly'] as const;
export type TokenDisposition = (typeof TOKEN_DISPOSITIONS)[number];

/** Who sees the token's nameplate, and when. */
export const TOKEN_NAME_DISPLAYS = ['none', 'control', 'owner-hover', 'hover', 'owner', 'always'] as const;
export type TokenNameDisplay = (typeof TOKEN_NAME_DISPLAYS)[number];

/** The actor a token stands for, as far as token commands care. */
export interface TokenActor {
  readonly id: string;
  readonly type: string | null;
  readonly statuses: readonly string[];
  readonly vitals: ActorVitals;
}

export interface Token {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  /** Size in grid cells. */
  readonly width: number;
  readonly height: number;
  readonly elevation: number;
  readonly rotation: number;
  readonly hidden: boolean;
  readonly textureSrc: string;
  readonly disposition: TokenDisposition;
  /** The actor the token is declared for; it may no longer exist. */
  readonly actorId: string | null;
  /** Linked tokens share their actor's data; unlinked ones are independent copies. */
  readonly actorLink: boolean;
  readonly actor: TokenActor | null;
}

/** What only a placed token stores. */
export interface TokenPlacementChanges {
  readonly shape?: TokenShape | undefined;
  readonly locked?: boolean | undefined;
  readonly sort?: number | undefined;
}

/**
 * `scale` sets both texture scales and keeps the current mirroring; it may not
 * come with `texture.scaleX` / `texture.scaleY`.
 */
export interface TokenDraft extends TokenAppearanceChanges, TokenPlacementChanges {
  readonly actorId: string;
  readonly x: number;
  readonly y: number;
  readonly hidden?: boolean | undefined;
  readonly elevation?: number | undefined;
  readonly rotation?: number | undefined;
  readonly scale?: number | undefined;
  readonly actorLink?: boolean | undefined;
  readonly name?: string | undefined;
  readonly nameDisplay?: TokenNameDisplay | undefined;
  readonly disposition?: TokenDisposition | undefined;
  readonly lockRotation?: boolean | undefined;
}

export interface TokenChanges extends TokenAppearanceChanges, TokenPlacementChanges {
  readonly hidden?: boolean | undefined;
  readonly elevation?: number | undefined;
  readonly rotation?: number | undefined;
  readonly scale?: number | undefined;
  readonly name?: string | undefined;
  readonly nameDisplay?: TokenNameDisplay | undefined;
  readonly disposition?: TokenDisposition | undefined;
  readonly lockRotation?: boolean | undefined;
  readonly actorLink?: boolean | undefined;
}

/** A draft whose sight may ask for the vision mode's defaults. */
export type TokenDraftRequest = Omit<TokenDraft, 'sight'> & Pick<TokenAppearanceRequest, 'sight'>;

/** Changes whose sight may ask for the vision mode's defaults. */
export type TokenChangesRequest = Omit<TokenChanges, 'sight'> & Pick<TokenAppearanceRequest, 'sight'>;

export interface TokenPlacement {
  readonly x: number;
  readonly y: number;
  readonly elevation?: number | undefined;
  readonly rotation?: number | undefined;
}

export function hasChanges(changes: TokenChanges): boolean {
  return Object.values(changes).some((value) => value !== undefined);
}

/**
 * A player character placed as an unlinked token keeps its own HP and effects:
 * damage lands on the copy while sheet edits land on the actor.
 */
export function isUnlinkedCharacter(token: Token): boolean {
  return !token.actorLink && token.actor?.type === 'character';
}
