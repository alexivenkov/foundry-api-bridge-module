import {
  gridTypeStringToNumber,
  gridTypeNumberToString,
  mapSceneToCrudSummary,
  type FoundrySceneCrud
} from '../sceneTypes';

describe('gridTypeStringToNumber', () => {
  it('maps every known grid type wire string to correct number', () => {
    expect(gridTypeStringToNumber('gridless')).toBe(0);
    expect(gridTypeStringToNumber('square')).toBe(1);
    expect(gridTypeStringToNumber('hexPointyOdd')).toBe(2);
    expect(gridTypeStringToNumber('hexPointyEven')).toBe(3);
    expect(gridTypeStringToNumber('hexFlatOdd')).toBe(4);
    expect(gridTypeStringToNumber('hexFlatEven')).toBe(5);
  });
});

describe('gridTypeNumberToString', () => {
  it('maps every known grid number to correct wire string', () => {
    expect(gridTypeNumberToString(0)).toBe('gridless');
    expect(gridTypeNumberToString(1)).toBe('square');
    expect(gridTypeNumberToString(2)).toBe('hexPointyOdd');
    expect(gridTypeNumberToString(3)).toBe('hexPointyEven');
    expect(gridTypeNumberToString(4)).toBe('hexFlatOdd');
    expect(gridTypeNumberToString(5)).toBe('hexFlatEven');
  });

  it('falls back to "square" for unknown grid number', () => {
    expect(gridTypeNumberToString(99)).toBe('square');
    expect(gridTypeNumberToString(-1)).toBe('square');
  });
});

function makeBaseScene(overrides?: Partial<FoundrySceneCrud>): FoundrySceneCrud {
  return {
    id: 's1',
    uuid: 'Scene.s1',
    name: 'Scene',
    active: false,
    width: 4000,
    height: 3000,
    background: { src: 'maps/x.jpg' },
    navigation: true,
    navName: null,
    navOrder: 1,
    folder: null,
    grid: { type: 1, size: 100, distance: 5, units: 'ft' },
    update: jest.fn(),
    delete: jest.fn(),
    clone: jest.fn(),
    view: jest.fn(),
    ...overrides
  };
}

describe('mapSceneToCrudSummary', () => {
  it('maps a fully populated scene', () => {
    const scene = makeBaseScene({
      folder: { id: 'f1', name: 'Maps' },
      navName: 'My Nav',
      navOrder: 5
    });

    const summary = mapSceneToCrudSummary(scene);

    expect(summary).toEqual({
      id: 's1',
      uuid: 'Scene.s1',
      name: 'Scene',
      active: false,
      width: 4000,
      height: 3000,
      background: 'maps/x.jpg',
      navigation: true,
      navName: 'My Nav',
      navOrder: 5,
      folder: 'Maps',
      grid: { type: 'square', size: 100, distance: 5, units: 'ft' }
    });
  });

  it('extracts background from string form (legacy v10)', () => {
    const scene = makeBaseScene({ background: 'maps/legacy.jpg' });
    const summary = mapSceneToCrudSummary(scene);
    expect(summary.background).toBe('maps/legacy.jpg');
  });

  it('returns null background when bg is empty string', () => {
    const scene = makeBaseScene({ background: '' });
    const summary = mapSceneToCrudSummary(scene);
    expect(summary.background).toBeNull();
  });

  it('returns null background when bg.src is undefined', () => {
    const scene = makeBaseScene({ background: {} });
    const summary = mapSceneToCrudSummary(scene);
    expect(summary.background).toBeNull();
  });

  it('returns null background when bg is undefined', () => {
    const scene = makeBaseScene({ background: undefined });
    const summary = mapSceneToCrudSummary(scene);
    expect(summary.background).toBeNull();
  });

  it('returns null background when bg is null', () => {
    const scene = makeBaseScene({ background: null });
    const summary = mapSceneToCrudSummary(scene);
    expect(summary.background).toBeNull();
  });

  it('falls back to defaults when scene fields are undefined', () => {
    const scene = makeBaseScene({
      width: undefined,
      height: undefined,
      navigation: undefined,
      navName: undefined,
      navOrder: undefined,
      folder: undefined,
      grid: undefined
    });

    const summary = mapSceneToCrudSummary(scene);

    expect(summary.width).toBe(0);
    expect(summary.height).toBe(0);
    expect(summary.navigation).toBe(false);
    expect(summary.navName).toBeNull();
    expect(summary.navOrder).toBe(0);
    expect(summary.folder).toBeNull();
    expect(summary.grid).toEqual({ type: 'square', size: 100, distance: 5, units: 'ft' });
  });

  it('falls back to defaults when grid sub-fields are undefined', () => {
    const scene = makeBaseScene({
      grid: { type: undefined, size: undefined, distance: undefined, units: undefined }
    });

    const summary = mapSceneToCrudSummary(scene);

    expect(summary.grid).toEqual({ type: 'square', size: 100, distance: 5, units: 'ft' });
  });

  it('maps hex grid type number correctly', () => {
    const scene = makeBaseScene({ grid: { type: 4, size: 75, distance: 1.5, units: 'm' } });
    const summary = mapSceneToCrudSummary(scene);
    expect(summary.grid).toEqual({ type: 'hexFlatOdd', size: 75, distance: 1.5, units: 'm' });
  });
});
