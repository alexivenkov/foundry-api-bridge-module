import type { FoundryPrototypeTokenSource, FoundryTokenSource } from '../foundryTokenAppearanceTypes';

// Stored token data as the BaseToken model of Foundry 13.351 and 14.368
// produces it for `new BaseToken({ x: 0, y: 0 })` (taken from the Node probe),
// with the version-specific fields of each generation.

const COMMON = {
  name: 'Goblin',
  displayName: 0,
  actorLink: false,
  width: 1,
  height: 1,
  lockRotation: false,
  rotation: 0,
  alpha: 1,
  disposition: -1,
  displayBars: 0,
  bar1: { attribute: 'attributes.hp' },
  bar2: { attribute: null },
  light: {
    negative: false,
    priority: 0,
    alpha: 0.5,
    angle: 360,
    bright: 0,
    color: null,
    coloration: 1,
    dim: 0,
    attenuation: 0.5,
    luminosity: 0.5,
    saturation: 0,
    contrast: 0,
    shadows: 0,
    animation: { type: null, speed: 5, intensity: 5, reverse: false },
    darkness: { min: 0, max: 1 }
  },
  sight: {
    enabled: false,
    range: 0,
    angle: 360,
    visionMode: 'basic',
    color: null,
    attenuation: 0.1,
    brightness: 0,
    saturation: 0,
    contrast: 0
  },
  occludable: { radius: 0 },
  ring: { enabled: false, colors: { ring: null, background: null }, effects: 1, subject: { scale: 1, texture: null } },
  turnMarker: { mode: 1, animation: null, src: null, disposition: false },
  movementAction: null,
  shape: 4,
  locked: false,
  sort: 0
};

export function v13TokenSource(overrides: Partial<FoundryTokenSource> = {}): FoundryTokenSource {
  return {
    ...COMMON,
    texture: {
      src: 'icons/svg/mystery-man.svg',
      anchorX: 0.5,
      anchorY: 0.5,
      offsetX: 0,
      offsetY: 0,
      fit: 'contain',
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      tint: '#ffffff',
      alphaThreshold: 0.75
    },
    detectionModes: [],
    ...overrides
  };
}

export function v14TokenSource(overrides: Partial<FoundryTokenSource> = {}): FoundryTokenSource {
  return {
    ...COMMON,
    depth: 1,
    texture: {
      src: 'icons/svg/mystery-man.svg',
      anchorX: 0.5,
      anchorY: 0.5,
      fit: 'contain',
      scaleX: 1,
      scaleY: 1,
      tint: '#ffffff',
      alphaThreshold: 0.75
    },
    detectionModes: {},
    ...overrides
  };
}

export function prototypeSource(overrides: Partial<FoundryPrototypeTokenSource> = {}): FoundryPrototypeTokenSource {
  const { shape: _shape, locked: _locked, sort: _sort, ...token } = v14TokenSource();
  return { ...token, randomImg: false, appendNumber: false, prependAdjective: false, ...overrides };
}
