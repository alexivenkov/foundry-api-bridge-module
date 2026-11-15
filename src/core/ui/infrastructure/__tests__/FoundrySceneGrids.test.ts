import { FoundrySceneGrids } from '../FoundrySceneGrids';
import type { FoundryGridGame, FoundryGridScene, FoundrySceneGrid } from '../foundryUiTypes';

interface World {
  grids: FoundrySceneGrids;
  grid: FoundrySceneGrid;
  measurePath: jest.Mock;
  getSnappedPoint: jest.Mock;
}

// What SquareGrid({size: 100, distance: 5, units: 'ft', diagonals: ALTERNATING_1}) answered under
// Node on 13.351 and 14.368 for [{50,50},{350,350},{450,350}] and for a CENTER snap of {130,170}.
const MEASURED = {
  waypoints: [],
  distance: 25,
  cost: 25,
  spaces: 4,
  diagonals: 3,
  euclidean: 26.213,
  segments: [
    { from: {}, to: {}, distance: 20, cost: 20, spaces: 3, diagonals: 3, euclidean: 21.213 },
    { from: {}, to: {}, distance: 5, cost: 5, spaces: 1, diagonals: 0, euclidean: 5 }
  ]
};

function world(generation = 13, gridOverrides: Partial<FoundrySceneGrid> = {}, sceneGrid?: object): World {
  const measurePath = jest.fn(() => MEASURED);
  const getSnappedPoint = jest.fn(() => ({ x: 150, y: 150 }));
  const grid: FoundrySceneGrid = { type: 1, units: 'ft', diagonals: 4, measurePath, getSnappedPoint, ...gridOverrides };
  const scene: FoundryGridScene = { id: 's1', name: 'Crypt', grid: sceneGrid ?? grid };
  const game: FoundryGridGame = { scenes: { get: (id) => (id === 's1' ? scene : undefined), active: undefined } };
  return { grids: new FoundrySceneGrids({ getGame: () => game }, () => generation), grid, measurePath, getSnappedPoint };
}

describe('FoundrySceneGrids', () => {
  it('measures from generation 12 and takes elevation from 13', () => {
    expect(world(11).grids.supportsMeasurement()).toBe(false);
    expect(world(12).grids.supportsMeasurement()).toBe(true);
    expect(world(12).grids.supportsElevation()).toBe(false);
    expect(world(14).grids.supportsElevation()).toBe(true);
  });

  it('describes the grid with the world diagonal rule', () => {
    expect(world().grids.describe('s1')).toEqual({ type: 'square', units: 'ft', diagonalRule: 'alternating1' });
    expect(world(13, { type: 4, diagonals: 0 }).grids.describe('s1')).toEqual({
      type: 'hexFlatOdd',
      units: 'ft',
      diagonalRule: 'equidistant'
    });
    expect(world(13, { type: 0, diagonals: undefined, units: 'm' }).grids.describe('s1')).toEqual({
      type: 'gridless',
      units: 'm',
      diagonalRule: null
    });
    expect(world().grids.describe('nope')).toBeNull();
  });

  it('passes only the waypoint keys that are set and maps the measurement', () => {
    const { grids, measurePath } = world();

    const result = grids.measurePath('s1', [
      { x: 50, y: 50 },
      { x: 350, y: 350, elevation: undefined, teleport: false },
      { x: 450, y: 350, elevation: 10 }
    ]);

    expect(measurePath).toHaveBeenCalledWith([
      { x: 50, y: 50 },
      { x: 350, y: 350, teleport: false },
      { x: 450, y: 350, elevation: 10 }
    ]);
    expect(result).toEqual({
      distance: 25,
      cost: 25,
      spaces: 4,
      diagonals: 3,
      euclidean: 26.213,
      segments: [
        { distance: 20, cost: 20, spaces: 3, diagonals: 3, euclidean: 21.213 },
        { distance: 5, cost: 5, spaces: 1, diagonals: 0, euclidean: 5 }
      ]
    });
  });

  it('combines the snapping modes into the core mask', () => {
    const { grids, getSnappedPoint } = world();

    expect(grids.snapPoint('s1', { x: 130, y: 170 }, { modes: ['center', 'vertex'], resolution: 2 })).toEqual({ x: 150, y: 150 });
    grids.snapPoint('s1', { x: 0, y: 0 }, { modes: ['sideMidpoint', 'corner', 'edgeMidpoint'], resolution: 1 });

    expect(getSnappedPoint).toHaveBeenNthCalledWith(1, { x: 130, y: 170 }, { mode: 0xf1, resolution: 2 });
    expect(getSnappedPoint).toHaveBeenNthCalledWith(2, { x: 0, y: 0 }, { mode: 0xff02, resolution: 1 });
  });

  it('refuses a scene that is gone and a core without grid instances', () => {
    expect(() => world().grids.measurePath('nope', [])).toThrow('Scene not found: nope');
    expect(() => world(13, {}, { type: 1, size: 100 }).grids.describe('s1')).toThrow(
      'Grid measurement and snapping require Foundry 12 or newer'
    );
  });
});
