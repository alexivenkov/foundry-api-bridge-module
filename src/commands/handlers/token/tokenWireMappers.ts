import type {
  LightEmission,
  PrototypeTokenSnapshot,
  TokenAppearance as WireTokenAppearance,
  TokenAppearanceDetail as WireTokenAppearanceDetail,
  TokenDetail,
  TokenInRangeEntry,
  TokenResult,
  TokenTexture as WireTokenTexture
} from '@/commands/types';
import {
  dispositionToWireCode,
  isUnlinkedCharacter,
  type PrototypeToken,
  type Token,
  type TokenAppearance,
  type TokenAppearanceDetail,
  type TokenAppearanceGameProvider,
  type TokenAppearanceGlobalsProvider,
  type TokenAtDistance,
  type TokenGameProvider,
  type TokenLight,
  type TokenMovementResult,
  type TokenTexture
} from '@/core/tokens';

export interface TokenHandlerDependencies {
  gameProvider?: TokenGameProvider;
}

/** The appearance and prototype commands also read world actors and the client registries. */
export interface TokenAppearanceHandlerDependencies {
  gameProvider?: TokenAppearanceGameProvider;
  globals?: TokenAppearanceGlobalsProvider;
  generation?: () => number;
}

function toWireTexture(texture: TokenTexture): WireTokenTexture {
  const wire: WireTokenTexture = {
    src: texture.src,
    tint: texture.tint,
    fit: texture.fit,
    anchorX: texture.anchorX,
    anchorY: texture.anchorY,
    scaleX: texture.scaleX,
    scaleY: texture.scaleY,
    alphaThreshold: texture.alphaThreshold
  };
  if (texture.offsetX !== undefined) {
    wire.offsetX = texture.offsetX;
  }
  if (texture.offsetY !== undefined) {
    wire.offsetY = texture.offsetY;
  }
  if (texture.rotation !== undefined) {
    wire.rotation = texture.rotation;
  }
  return wire;
}

function toWireLight(light: TokenLight): LightEmission {
  const wire: LightEmission = {
    dim: light.dim,
    bright: light.bright,
    angle: light.angle,
    color: light.color,
    alpha: light.alpha,
    coloration: light.coloration,
    luminosity: light.luminosity,
    attenuation: light.attenuation,
    saturation: light.saturation,
    contrast: light.contrast,
    shadows: light.shadows,
    animation: { ...light.animation },
    darkness: { ...light.darkness }
  };
  if (light.negative !== undefined) {
    wire.negative = light.negative;
  }
  if (light.priority !== undefined) {
    wire.priority = light.priority;
  }
  return wire;
}

export function toWireAppearance(appearance: TokenAppearance): WireTokenAppearance {
  const wire: WireTokenAppearance = {
    width: appearance.width,
    height: appearance.height,
    texture: toWireTexture(appearance.texture),
    alpha: appearance.alpha,
    rotation: appearance.rotation,
    lockRotation: appearance.lockRotation,
    disposition: appearance.disposition,
    displayName: appearance.nameDisplay,
    displayBars: appearance.barDisplay,
    bar1: appearance.bar1,
    bar2: appearance.bar2,
    light: toWireLight(appearance.light),
    sight: { ...appearance.sight },
    detectionModes: appearance.detectionModes.map((mode) => ({ ...mode })),
    occludableRadius: appearance.occludableRadius
  };
  if (appearance.depth !== undefined) {
    wire.depth = appearance.depth;
  }
  if (appearance.ring !== undefined) {
    wire.ring = { ...appearance.ring, effects: [...appearance.ring.effects] };
  }
  if (appearance.turnMarker !== undefined) {
    wire.turnMarker = { ...appearance.turnMarker };
  }
  if (appearance.movementAction !== undefined) {
    wire.movementAction = appearance.movementAction;
  }
  return wire;
}

export function toWireAppearanceDetail(appearance: TokenAppearanceDetail): WireTokenAppearanceDetail {
  const wire: WireTokenAppearanceDetail = {
    ...toWireAppearance(appearance),
    locked: appearance.locked,
    sort: appearance.sort
  };
  if (appearance.shape !== undefined) {
    wire.shape = appearance.shape;
  }
  return wire;
}

export function toWirePrototype(prototype: PrototypeToken): PrototypeTokenSnapshot {
  return {
    ...toWireAppearance(prototype),
    actorId: prototype.actorId,
    name: prototype.name,
    actorLink: prototype.actorLink,
    randomImg: prototype.randomImg,
    appendNumber: prototype.appendNumber,
    prependAdjective: prototype.prependAdjective
  };
}

/** Adds the appearance to a result when it was asked for and could be read. */
export function withWireAppearance<T extends TokenResult | TokenDetail>(
  result: T,
  appearance: TokenAppearanceDetail | null
): T {
  if (appearance !== null) {
    result.appearance = toWireAppearanceDetail(appearance);
  }
  return result;
}

export function toWireTokenResult(token: Token): TokenResult {
  const result: TokenResult = {
    id: token.id,
    name: token.name,
    actorId: token.actor?.id ?? null,
    x: token.x,
    y: token.y,
    width: token.width,
    height: token.height,
    elevation: token.elevation,
    rotation: token.rotation,
    hidden: token.hidden,
    img: token.textureSrc,
    disposition: dispositionToWireCode(token.disposition),
    actorLink: token.actorLink,
    conditions: token.actor ? [...token.actor.statuses] : []
  };

  const vitals = token.actor?.vitals;
  if (vitals?.hp) {
    result.hp = { value: vitals.hp.value, max: vitals.hp.max };
  }
  if (vitals && vitals.ac !== null) {
    result.ac = vitals.ac;
  }
  if (isUnlinkedCharacter(token)) {
    result.warning = 'unlinked_character_token';
  }

  return result;
}

export function toWireMovementResult(movement: TokenMovementResult): TokenResult {
  const result = toWireTokenResult(movement.token);
  if (movement.pathCost !== undefined) {
    result.pathCost = movement.pathCost;
  }
  if (movement.doorsOpened !== undefined) {
    result.doorsOpened = [...movement.doorsOpened];
  }
  return result;
}

export function toWireTokenDetail(token: Token, sceneId: string): TokenDetail {
  const vitals = token.actor?.vitals;
  return {
    id: token.id,
    sceneId,
    name: token.name,
    x: token.x,
    y: token.y,
    width: token.width,
    height: token.height,
    elevation: token.elevation,
    rotation: token.rotation,
    hidden: token.hidden,
    disposition: token.disposition,
    actorId: token.actorId,
    actorLink: token.actorLink,
    textureSrc: token.textureSrc,
    hp: vitals?.hp ? { current: vitals.hp.value, max: vitals.hp.max } : null,
    ac: vitals?.ac ?? null
  };
}

export function toWireTokenInRange({ token, distance }: TokenAtDistance): TokenInRangeEntry {
  return {
    id: token.id,
    name: token.name,
    x: token.x,
    y: token.y,
    distance,
    actorId: token.actorId,
    disposition: token.disposition
  };
}
