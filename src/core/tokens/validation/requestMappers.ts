import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateTokenCommand,
  CreateTokenWithAppearanceCommand,
  DeleteTokenCommand,
  GetTokenByActorQuery,
  GetTokenQuery,
  ListTokensQuery,
  MoveTokenCommand,
  PrototypeTokenQuery,
  SetTokenTargetCommand,
  TokensInRangeQuery,
  UpdatePrototypeTokenCommand,
  UpdateTokenCommand,
  UpdateTokenWithAppearanceCommand
} from '@/core/tokens/application';
import type {
  TokenAppearanceRequest,
  TokenDisposition,
  TokenNameDisplay,
  TokenPlacementChanges
} from '@/core/tokens/domain';
import type {
  GetPrototypeTokenRequest,
  TokenAppearanceInput,
  UpdatePrototypeTokenRequest
} from './tokenAppearanceSchemas';
import { dispositionFromWireCode, nameDisplayFromWireCode } from './tokenWireCodes';
import type {
  CreateTokenRequest,
  DeleteTokenRequest,
  GetSceneTokensRequest,
  GetTokenByActorRequest,
  GetTokenRequest,
  GetTokensInRangeRequest,
  MoveTokenRequest,
  SetTokenTargetRequest,
  UpdateTokenRequest
} from './tokenSchemas';

/** A name passes through; a number is read as the legacy wire code. */
function toNameDisplay(input: number | TokenNameDisplay | undefined): TokenNameDisplay | undefined {
  return typeof input === 'number' ? nameDisplayFromWireCode(input) : input;
}

function toDisposition(input: number | TokenDisposition | undefined): TokenDisposition | undefined {
  return typeof input === 'number' ? dispositionFromWireCode(input) : input;
}

/** An empty animation id means "none", as the core's own forms submit it. */
function emptyAsNull(value: string | null | undefined): string | null | undefined {
  return value === '' ? null : value;
}

function toAppearanceRequest(request: TokenAppearanceInput): TokenAppearanceRequest {
  const light = request.light;
  return {
    width: request.width,
    height: request.height,
    depth: request.depth,
    texture: request.texture,
    alpha: request.alpha,
    barDisplay: request.displayBars,
    bar1: request.bar1,
    bar2: request.bar2,
    light:
      light !== undefined
        ? {
            ...light,
            animation: light.animation !== undefined ? { ...light.animation, type: emptyAsNull(light.animation.type) } : undefined
          }
        : undefined,
    sight: request.sight,
    detectionModes: request.detectionModes?.map((mode) => ({
      id: mode.id,
      enabled: mode.enabled ?? true,
      range: mode.range ?? null
    })),
    occludableRadius: request.occludableRadius,
    ring: request.ring,
    turnMarker: request.turnMarker,
    movementAction: request.movementAction
  };
}

function toPlacementChanges(request: TokenPlacementChanges): TokenPlacementChanges {
  return { shape: request.shape, locked: request.locked, sort: request.sort };
}

export function toCreateTokenWithAppearanceCommand(request: CreateTokenRequest): CreateTokenWithAppearanceCommand {
  const base = toCreateTokenCommand(request);
  return {
    sceneId: base.sceneId,
    draft: {
      ...base.draft,
      ...toAppearanceRequest(request),
      ...toPlacementChanges(request),
      name: request.name,
      nameDisplay: toNameDisplay(request.displayName),
      disposition: toDisposition(request.disposition),
      lockRotation: request.lockRotation
    },
    fromPrototype: request.fromPrototype === true,
    includeAppearance: request.includeAppearance === true
  };
}

export function toUpdateTokenWithAppearanceCommand(request: UpdateTokenRequest): UpdateTokenWithAppearanceCommand {
  const base = toUpdateTokenCommand(request);
  return {
    sceneId: base.sceneId,
    tokenId: base.tokenId,
    changes: { ...base.changes, ...toAppearanceRequest(request), ...toPlacementChanges(request) },
    includeAppearance: request.includeAppearance === true
  };
}

export function toPrototypeTokenQuery(request: GetPrototypeTokenRequest): PrototypeTokenQuery {
  return { actorId: request.actorId };
}

export function toUpdatePrototypeTokenCommand(request: UpdatePrototypeTokenRequest): UpdatePrototypeTokenCommand {
  return {
    actorId: request.actorId,
    changes: {
      ...toAppearanceRequest(request),
      name: request.name,
      actorLink: request.actorLink,
      randomImg: request.randomImg,
      appendNumber: request.appendNumber,
      prependAdjective: request.prependAdjective,
      rotation: request.rotation,
      lockRotation: request.lockRotation,
      disposition: toDisposition(request.disposition),
      nameDisplay: toNameDisplay(request.displayName)
    }
  };
}

export function toListTokensQuery(request: GetSceneTokensRequest): ListTokensQuery {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toGetTokenQuery(request: GetTokenRequest): GetTokenQuery {
  return { sceneId: emptyAsAbsent(request.sceneId), tokenId: request.tokenId };
}

export function toGetTokenByActorQuery(request: GetTokenByActorRequest): GetTokenByActorQuery {
  return { sceneId: emptyAsAbsent(request.sceneId), actorId: request.actorId };
}

export function toTokensInRangeQuery(request: GetTokensInRangeRequest): TokensInRangeQuery {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    originX: request.originX,
    originY: request.originY,
    range: request.range,
    excludeTokenId: request.excludeTokenId
  };
}

export function toCreateTokenCommand(request: CreateTokenRequest): CreateTokenCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    draft: {
      actorId: request.actorId,
      x: request.x,
      y: request.y,
      hidden: request.hidden,
      elevation: request.elevation,
      rotation: request.rotation,
      scale: request.scale,
      actorLink: request.actorLink
    }
  };
}

export function toUpdateTokenCommand(request: UpdateTokenRequest): UpdateTokenCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    tokenId: request.tokenId,
    changes: {
      hidden: request.hidden,
      elevation: request.elevation,
      rotation: request.rotation,
      scale: request.scale,
      name: request.name,
      nameDisplay: toNameDisplay(request.displayName),
      disposition: toDisposition(request.disposition),
      lockRotation: request.lockRotation,
      actorLink: request.actorLink
    }
  };
}

export function toDeleteTokenCommand(request: DeleteTokenRequest): DeleteTokenCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), tokenId: request.tokenId };
}

export function toMoveTokenCommand(request: MoveTokenRequest): MoveTokenCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    tokenId: request.tokenId,
    x: request.x,
    y: request.y,
    elevation: request.elevation,
    rotation: request.rotation,
    animate: request.animate !== false,
    canOpenDoors: request.canOpenDoors === true
  };
}

export function toSetTokenTargetCommand(request: SetTokenTargetRequest): SetTokenTargetCommand {
  return {
    tokenId: request.tokenId,
    targeted: request.targeted,
    releaseOthers: request.releaseOthers ?? true
  };
}
