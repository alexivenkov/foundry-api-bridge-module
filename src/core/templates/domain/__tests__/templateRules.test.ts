import { findTemplateUnavailability } from '../rules/templateFeatures';
import { completeTemplateShape } from '../rules/templateToolDefaults';

describe('findTemplateUnavailability', () => {
  it('serves Foundry 12–13 only', () => {
    expect(findTemplateUnavailability({ supported: true, mergedIntoRegions: false })).toBeNull();
    expect(findTemplateUnavailability({ supported: false, mergedIntoRegions: false })).toBe(
      'Measured template commands require Foundry 12 or newer'
    );
    expect(findTemplateUnavailability({ supported: true, mergedIntoRegions: true })).toBe(
      'Measured templates are not available in Foundry 14 or newer; use regions'
    );
  });
});

describe('completeTemplateShape', () => {
  const defaults = { coneAngle: 53.13, rayWidth: 5 };

  it('opens a cone without an angle as the template tool does', () => {
    expect(completeTemplateShape({ type: 'cone', angle: 0, width: 0 }, defaults)).toEqual({ angle: 53.13 });
    expect(completeTemplateShape({ type: 'cone', angle: 90, width: 0 }, defaults)).toEqual({});
  });

  it('widens a ray without a width as the template tool does', () => {
    expect(completeTemplateShape({ type: 'ray', angle: 0, width: 0 }, defaults)).toEqual({ width: 5 });
    expect(completeTemplateShape({ type: 'ray', angle: 0, width: 10 }, defaults)).toEqual({});
  });

  it('leaves circles and rectangles alone', () => {
    expect(completeTemplateShape({ type: 'circle', angle: 0, width: 0 }, defaults)).toEqual({});
    expect(completeTemplateShape({ type: 'rectangle', angle: 0, width: 0 }, defaults)).toEqual({});
  });
});
