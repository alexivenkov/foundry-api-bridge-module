import { CoreFeatureUnavailableError } from '../../../shared';
import {
  DuplicateDetectionModeError,
  InvalidTokenLightDarknessRangeError,
  NEW_TOKEN_LIGHT,
  TokenScaleConflictError,
  UnknownTokenRegistryIdError,
  VisionModeDefaultsWithoutModeError,
  assertDetectionModes,
  assertScaleWithoutTextureScale,
  assertTokenAppearance,
  assertTokenFeatures,
  resolveSightRequest,
  type TokenAppearanceEnvironment,
  type TokenFeatures
} from '..';

const ALL: TokenFeatures = { ring: true, darknessSources: true, movement: true, depth: true, textureOffset: false };
const V13: TokenFeatures = { ring: true, darknessSources: true, movement: true, depth: false, textureOffset: true };
const V11: TokenFeatures = { ring: false, darknessSources: false, movement: false, depth: false, textureOffset: true };

function environment(overrides: Partial<TokenAppearanceEnvironment> = {}): TokenAppearanceEnvironment {
  return {
    features: () => ALL,
    lightAnimations: (kind) => (kind === 'darkness' ? ['magicalGloom'] : ['torch', 'pulse']),
    visionModes: () => ['basic', 'darkvision'],
    visionModeDefaults: () => ({}),
    detectionModes: () => ['basicSight', 'seeAll'],
    movementActions: () => ['walk', 'fly'],
    turnMarkerAnimations: () => ['spin'],
    ...overrides
  };
}

describe('token appearance rules', () => {
  describe('generation features', () => {
    it('refuses depth and the attenuation colorations before 14', () => {
      expect(() => assertTokenFeatures({ depth: 2 }, V13)).toThrow(
        new CoreFeatureUnavailableError('Token depth requires Foundry 14 or newer')
      );
      expect(() => assertTokenFeatures({ light: { coloration: 'natural-attenuation' } }, V13)).toThrow(
        'The natural-attenuation coloration requires Foundry 14 or newer'
      );
      expect(() => assertTokenFeatures({ light: { coloration: 'color-burn' } }, V13)).not.toThrow();
    });

    it('refuses texture offset and rotation from 14 on', () => {
      expect(() => assertTokenFeatures({ texture: { offsetX: 4 } }, ALL)).toThrow(
        'Token texture offset and rotation are not available in Foundry 14 or newer'
      );
      expect(() => assertTokenFeatures({ texture: { rotation: 10 } }, V13)).not.toThrow();
    });

    it('refuses the ring, darkness sources, shapes, turn markers and movement actions on an old core', () => {
      expect(() => assertTokenFeatures({ ring: { enabled: true } }, V11)).toThrow('Dynamic token rings require Foundry 12 or newer');
      expect(() => assertTokenFeatures({ light: { priority: 1 } }, V11)).toThrow(
        'Darkness sources and light priority require Foundry 12 or newer'
      );
      for (const changes of [{ shape: 'ellipse-1' as const }, { turnMarker: { mode: 'custom' as const } }, { movementAction: null }]) {
        expect(() => assertTokenFeatures(changes, V11)).toThrow(
          'Token shapes, turn markers and movement actions require Foundry 13 or newer'
        );
      }
    });
  });

  it('refuses the legacy scale together with an explicit texture scale', () => {
    expect(() => assertScaleWithoutTextureScale(2, { scaleX: 1 })).toThrow(TokenScaleConflictError);
    expect(() => assertScaleWithoutTextureScale(2, { tint: '#ffffff' })).not.toThrow();
    expect(() => assertScaleWithoutTextureScale(undefined, { scaleY: 1 })).not.toThrow();
  });

  it('refuses a duplicated or unknown detection mode', () => {
    expect(() =>
      assertDetectionModes(
        [
          { id: 'basicSight', enabled: true, range: 30 },
          { id: 'basicSight', enabled: true, range: 10 }
        ],
        null
      )
    ).toThrow(new DuplicateDetectionModeError('basicSight'));
    expect(() => assertDetectionModes([{ id: 'xray', enabled: true, range: null }], ['basicSight'])).toThrow(
      new UnknownTokenRegistryIdError('detection mode', 'xray', ['basicSight'])
    );
  });

  describe('assertTokenAppearance', () => {
    it('checks light animations against the registry of the light kind the token ends up with', () => {
      expect(() => assertTokenAppearance({ light: { animation: { type: 'torch' } } }, NEW_TOKEN_LIGHT, environment())).not.toThrow();
      expect(() =>
        assertTokenAppearance({ light: { negative: true, animation: { type: 'torch' } } }, NEW_TOKEN_LIGHT, environment())
      ).toThrow('Unknown darkness animation: torch. Known: magicalGloom');
      expect(() =>
        assertTokenAppearance({ light: { animation: { type: 'magicalGloom' } } }, { ...NEW_TOKEN_LIGHT, negative: true }, environment())
      ).not.toThrow();
    });

    it('refuses a darkness range whose min would exceed its max', () => {
      expect(() =>
        assertTokenAppearance({ light: { darkness: { min: 0.8 } } }, { negative: false, darkness: { min: 0, max: 0.5 } }, environment())
      ).toThrow(InvalidTokenLightDarknessRangeError);
    });

    it('checks vision mode, movement action and turn marker animation ids', () => {
      const env = environment();
      expect(() => assertTokenAppearance({ sight: { visionMode: 'xray' } }, NEW_TOKEN_LIGHT, env)).toThrow(
        'Unknown vision mode: xray. Known: basic, darkvision'
      );
      expect(() => assertTokenAppearance({ movementAction: 'teleport' }, NEW_TOKEN_LIGHT, env)).toThrow('Unknown movement action');
      expect(() => assertTokenAppearance({ turnMarker: { animation: 'wobble' } }, NEW_TOKEN_LIGHT, env)).toThrow(
        'Unknown turn marker animation'
      );
      expect(() => assertTokenAppearance({ movementAction: null, turnMarker: { animation: null } }, NEW_TOKEN_LIGHT, env)).not.toThrow();
    });

    it('skips a registry it cannot read', () => {
      expect(() =>
        assertTokenAppearance({ sight: { visionMode: 'xray' } }, NEW_TOKEN_LIGHT, environment({ visionModes: () => null }))
      ).not.toThrow();
    });
  });

  describe('resolveSightRequest', () => {
    const defaults = (mode: string): { attenuation: number; saturation: number } =>
      mode === 'darkvision' ? { attenuation: 0, saturation: -1 } : { attenuation: 0.1, saturation: 0 };

    it('drops the flag when the defaults are not asked for', () => {
      expect(resolveSightRequest({ visionMode: 'darkvision', range: 60 }, defaults)).toEqual({ visionMode: 'darkvision', range: 60 });
    });

    it('puts the mode defaults under the requested fields', () => {
      expect(
        resolveSightRequest({ visionMode: 'darkvision', applyModeDefaults: true, saturation: -0.5, range: 60 }, defaults)
      ).toEqual({ attenuation: 0, saturation: -0.5, visionMode: 'darkvision', range: 60 });
    });

    it('refuses the defaults without a vision mode', () => {
      expect(() => resolveSightRequest({ applyModeDefaults: true }, defaults)).toThrow(VisionModeDefaultsWithoutModeError);
    });

    it('leaves an absent sight absent', () => {
      expect(resolveSightRequest(undefined, defaults)).toBeUndefined();
    });
  });
});
