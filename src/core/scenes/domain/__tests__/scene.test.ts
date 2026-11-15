import {
  CanvasNotReadyError,
  SCENE_GRID_TYPES,
  SceneCloneCancelledError,
  SceneCreationCancelledError,
  gridCellAt
} from '..';
import { DomainError } from '../../../../kernel';

describe('gridCellAt', () => {
  it.each([
    [250, 350, 100, { column: 2, row: 3 }],
    [0, 0, 100, { column: 0, row: 0 }],
    [99, 199, 100, { column: 0, row: 1 }],
    [100, 200, 100, { column: 1, row: 2 }],
    [150, 250, 50, { column: 3, row: 5 }]
  ])('puts the pixel (%d, %d) on a %d px grid into its cell', (x, y, cellSize, cell) => {
    expect(gridCellAt(x, y, cellSize)).toEqual(cell);
  });

  it('counts cells to the left of and above the origin as negative', () => {
    expect(gridCellAt(-1, -101, 100)).toEqual({ column: -1, row: -2 });
  });

  it.each([0, -50])('reads a cell size of %d as 100 px', (cellSize) => {
    expect(gridCellAt(250, 350, cellSize)).toEqual({ column: 2, row: 3 });
  });
});

describe('scene grid types', () => {
  it('names the square grid, the gridless one and the four hexagonal layouts', () => {
    expect(SCENE_GRID_TYPES).toEqual([
      'gridless',
      'square',
      'hexPointyOdd',
      'hexPointyEven',
      'hexFlatOdd',
      'hexFlatEven'
    ]);
  });
});

describe('scene errors', () => {
  it('carry the texts the commands answer with', () => {
    expect(new SceneCreationCancelledError().message).toBe(
      'Scene creation was cancelled by Foundry (a module hook may have vetoed it)'
    );
    expect(new SceneCloneCancelledError().message).toBe(
      'Scene clone was cancelled by Foundry (a module hook may have vetoed it)'
    );
    expect(new CanvasNotReadyError().message).toBe('Canvas not ready');
  });

  it('are domain errors', () => {
    expect(new SceneCreationCancelledError()).toBeInstanceOf(DomainError);
    expect(new SceneCloneCancelledError()).toBeInstanceOf(DomainError);
    expect(new CanvasNotReadyError()).toBeInstanceOf(DomainError);
  });
});
