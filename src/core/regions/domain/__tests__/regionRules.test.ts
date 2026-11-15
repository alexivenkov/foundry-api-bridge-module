import { CoreFeatureUnavailableError } from '../../../shared';
import { ValidationError } from '../../../../kernel';
import type { RegionFeatures } from '../ports/ports';
import { assertElevationOrder, assertRegionChangesSupported, mergeElevation } from '../rules/regionRules';

const V13: RegionFeatures = {
  available: true,
  shapeTypes: ['rectangle', 'circle', 'ellipse', 'polygon'],
  visibilities: ['layer', 'gamemaster', 'always'],
  extendedModel: false
};

const V14: RegionFeatures = {
  available: true,
  shapeTypes: ['rectangle', 'circle', 'ellipse', 'polygon', 'cone', 'ring', 'line', 'emanation', 'token', 'grid'],
  visibilities: ['layer', 'gamemaster', 'always', 'observer', 'layer-unlocked'],
  extendedModel: true
};

describe('assertRegionChangesSupported', () => {
  it('accepts what Foundry 13 can store', () => {
    expect(() =>
      assertRegionChangesSupported(V13, {
        name: 'A',
        visibility: 'always',
        elevation: { bottom: 0, top: 1 },
        shapes: [
          { type: 'rectangle', x: 0, y: 0, width: 1, height: 1, rotation: 10, hole: true },
          { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] }
        ]
      })
    ).not.toThrow();
  });

  it('names every Foundry 14 shape type, including an emanation base', () => {
    expect(() =>
      assertRegionChangesSupported(V13, {
        shapes: [
          { type: 'ring', x: 0, y: 0, radius: 5, innerWidth: 1, outerWidth: 1 },
          { type: 'emanation', base: { type: 'token', x: 0, y: 0, width: 1, height: 1, shape: 'ellipse-1' }, radius: 0 }
        ]
      })
    ).toThrow(new CoreFeatureUnavailableError('Region shape types ring, emanation, token require Foundry 14 or newer'));
  });

  it('names the Foundry 14 attributes and shape options', () => {
    expect(() =>
      assertRegionChangesSupported(V13, {
        levelIds: [],
        attachedTokenId: null,
        elevation: { topInclusive: true },
        shapes: [
          { type: 'rectangle', x: 0, y: 0, width: 1, height: 1, anchorX: 0.5, gridBased: true },
          { type: 'polygon', points: [], origin: null }
        ]
      })
    ).toThrow(
      'Region levelIds, attachedTokenId, elevation.topInclusive, shape anchorX, shape gridBased, shape origin require Foundry 14 or newer'
    );
  });

  it('refuses a visibility the core lacks', () => {
    expect(() => assertRegionChangesSupported(V13, { visibility: 'layer-unlocked' })).toThrow(
      "Region visibility 'layer-unlocked' requires Foundry 14 or newer"
    );
  });

  it('accepts everything on Foundry 14', () => {
    expect(() =>
      assertRegionChangesSupported(V14, {
        visibility: 'observer',
        hidden: true,
        restriction: { enabled: true },
        shapes: [{ type: 'grid', cells: [{ row: 0, column: 0 }], origin: null }]
      })
    ).not.toThrow();
  });
});

describe('elevation', () => {
  it('merges a partial change, null clearing a bound', () => {
    expect(mergeElevation({ bottom: 1, top: 9 }, { top: null })).toEqual({ bottom: 1, top: null });
    expect(mergeElevation({ bottom: 1, top: 9 }, {})).toEqual({ bottom: 1, top: 9 });
  });

  it('treats null bounds as unbounded', () => {
    expect(() => assertElevationOrder({ bottom: 5, top: null })).not.toThrow();
    expect(() => assertElevationOrder({ bottom: null, top: -5 })).not.toThrow();
    expect(() => assertElevationOrder({ bottom: 5, top: 5 })).not.toThrow();
    expect(() => assertElevationOrder({ bottom: 6, top: 5 })).toThrow(ValidationError);
  });
});
