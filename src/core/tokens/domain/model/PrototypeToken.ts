import type { TokenDisposition, TokenNameDisplay } from '@/core/tokens/domain/model/Token';
import type { TokenAppearance, TokenAppearanceChanges, TokenAppearanceRequest } from '@/core/tokens/domain/model/TokenAppearance';

/** The token an actor is placed as. */
export interface PrototypeToken extends TokenAppearance {
  readonly actorId: string;
  readonly name: string;
  readonly actorLink: boolean;
  readonly randomImg: boolean;
  readonly appendNumber: boolean;
  readonly prependAdjective: boolean;
}

interface PrototypeOnlyChanges {
  readonly name?: string | undefined;
  readonly actorLink?: boolean | undefined;
  readonly randomImg?: boolean | undefined;
  readonly appendNumber?: boolean | undefined;
  readonly prependAdjective?: boolean | undefined;
  readonly rotation?: number | undefined;
  readonly lockRotation?: boolean | undefined;
  readonly disposition?: TokenDisposition | undefined;
  readonly nameDisplay?: TokenNameDisplay | undefined;
}

export interface PrototypeTokenChanges extends TokenAppearanceChanges, PrototypeOnlyChanges {}

/** Changes whose sight may ask for the vision mode's defaults. */
export interface PrototypeTokenChangesRequest extends TokenAppearanceRequest, PrototypeOnlyChanges {}

/** Where a token of an actor stands. */
export interface ActorTokenPlacement {
  readonly sceneId: string;
  readonly sceneName: string;
  readonly sceneActive: boolean;
  readonly tokenId: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly elevation: number;
  readonly hidden: boolean;
  readonly actorLink: boolean;
}
