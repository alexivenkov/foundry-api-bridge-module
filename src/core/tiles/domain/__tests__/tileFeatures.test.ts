import { findUnsupportedTileFeature, type TileCapabilities } from '../rules/tileFeatures';

const FOUNDRY_13: TileCapabilities = {
  supported: true,
  names: false,
  levels: false,
  textureOffset: true,
  occlusionModeSet: false
};
const FOUNDRY_14: TileCapabilities = {
  supported: true,
  names: true,
  levels: true,
  textureOffset: false,
  occlusionModeSet: true
};
const FOUNDRY_11: TileCapabilities = { ...FOUNDRY_13, supported: false };

describe('findUnsupportedTileFeature', () => {
  it('refuses every tile command before Foundry 12', () => {
    expect(findUnsupportedTileFeature(FOUNDRY_11)).toBe('Tile commands require Foundry 12 or newer');
    expect(findUnsupportedTileFeature(FOUNDRY_11, { x: 1 })).toBe('Tile commands require Foundry 12 or newer');
  });

  it('accepts reads and plain changes on Foundry 13 and 14', () => {
    expect(findUnsupportedTileFeature(FOUNDRY_13)).toBeNull();
    expect(findUnsupportedTileFeature(FOUNDRY_14, { elevation: 20, restrictions: { light: true } })).toBeNull();
  });

  it('refuses names and levels before Foundry 14', () => {
    expect(findUnsupportedTileFeature(FOUNDRY_13, { name: 'Roof' })).toBe('Tile names require Foundry 14 or newer');
    expect(findUnsupportedTileFeature(FOUNDRY_13, { name: null })).toBe('Tile names require Foundry 14 or newer');
    expect(findUnsupportedTileFeature(FOUNDRY_13, { levels: [] })).toBe('Tile levels require Foundry 14 or newer');
    expect(findUnsupportedTileFeature(FOUNDRY_14, { name: 'Roof', levels: ['aaaaaaaaaaaaaaaa'] })).toBeNull();
  });

  it('refuses texture offset and rotation on Foundry 14, which removed them', () => {
    const refusal = 'Tile texture offset and rotation are not available in Foundry 14 or newer';
    expect(findUnsupportedTileFeature(FOUNDRY_14, { texture: { offsetX: 4 } })).toBe(refusal);
    expect(findUnsupportedTileFeature(FOUNDRY_14, { texture: { rotation: 90 } })).toBe(refusal);
    expect(findUnsupportedTileFeature(FOUNDRY_14, { texture: { tint: '#ff0000' } })).toBeNull();
    expect(findUnsupportedTileFeature(FOUNDRY_13, { texture: { offsetY: -4, rotation: 45 } })).toBeNull();
  });

  it('allows one classic occlusion mode or none before Foundry 14', () => {
    expect(findUnsupportedTileFeature(FOUNDRY_13, { occlusion: { modes: [] } })).toBeNull();
    expect(findUnsupportedTileFeature(FOUNDRY_13, { occlusion: { modes: ['vision'] } })).toBeNull();
    expect(findUnsupportedTileFeature(FOUNDRY_13, { occlusion: { modes: ['fade', 'radial'] } })).toBe(
      'Several occlusion modes at once require Foundry 14 or newer'
    );
    expect(findUnsupportedTileFeature(FOUNDRY_13, { occlusion: { modes: ['surface'] } })).toBe(
      'The surface occlusion mode requires Foundry 14 or newer'
    );
    expect(findUnsupportedTileFeature(FOUNDRY_14, { occlusion: { modes: ['fade', 'surface'] } })).toBeNull();
  });
});
