import { createClearTokenMovementHistoryHandler } from '../ClearTokenMovementHistoryHandler';
import { createFindTokenPathHandler } from '../FindTokenPathHandler';
import { createGetTokenMovementHistoryHandler } from '../GetTokenMovementHistoryHandler';
import { createMeasureTokenPathHandler } from '../MeasureTokenPathHandler';
import { createMoveTokenPathHandler } from '../MoveTokenPathHandler';
import { createPauseTokenMovementHandler } from '../PauseTokenMovementHandler';
import { createResumeTokenMovementHandler } from '../ResumeTokenMovementHandler';
import { createRevertTokenMovementHandler } from '../RevertTokenMovementHandler';
import { createStopTokenMovementHandler } from '../StopTokenMovementHandler';
import type { FoundryMovableToken, FoundryMovementGame, FoundryMovementScene } from '../tokenTypes';

function setup(generation = 14): {
  deps: { gameProvider: { getGame(): FoundryMovementGame }; globals: () => object; generation: () => number; wait: () => Promise<void> };
  token: FoundryMovableToken;
} {
  const token: FoundryMovableToken = {
    id: 't1',
    x: 100,
    y: 100,
    elevation: 0,
    movement: { id: '', state: 'completed', user: { id: 'gm', name: 'GM', isSelf: true } },
    _source: { _movementHistory: [{ x: 100, y: 100, elevation: 0, action: 'walk', movementId: 'm1', userId: 'gm', cost: 5, checkpoint: true }] },
    object: null,
    move: jest.fn((waypoints: Array<{ x?: number; y?: number }>) => {
      for (const waypoint of waypoints) {
        token.x = waypoint.x ?? token.x;
        token.y = waypoint.y ?? token.y;
      }
      token.movement = { id: 'mv1', state: 'completed', user: { id: 'gm', name: 'GM', isSelf: true } };
      return Promise.resolve(true);
    }),
    stopMovement: jest.fn().mockReturnValue(false),
    pauseMovement: jest.fn().mockReturnValue(null),
    resumeMovement: jest.fn(),
    measureMovementPath: jest.fn().mockReturnValue({ distance: 10, cost: 10, spaces: 2, diagonals: 0, segments: [{ distance: 10, cost: 10, spaces: 2, diagonals: 0 }] }),
    revertRecordedMovement: jest.fn().mockResolvedValue(true),
    clearMovementHistory: jest.fn().mockResolvedValue(undefined)
  };
  const scene: FoundryMovementScene = {
    id: 'keep',
    grid: { units: 'ft' },
    tokens: { get: (id) => (id === 't1' ? token : undefined), contents: [token] },
    clearMovementHistories: jest.fn().mockResolvedValue(undefined)
  };
  const game: FoundryMovementGame = { scenes: { get: (id) => (id === 'keep' ? scene : undefined), active: scene }, combats: { get: () => undefined } };
  return {
    deps: {
      gameProvider: { getGame: () => game },
      globals: () => ({ CONFIG: { Token: { movement: { actions: { walk: {}, fly: {} } } } } }),
      generation: () => generation,
      wait: () => Promise.resolve()
    },
    token
  };
}

describe('core token movement handlers', () => {
  it('moves along waypoints and reports the arrival', async () => {
    const { deps, token } = setup();

    const result = await createMoveTokenPathHandler(deps)({ tokenId: 't1', waypoints: [{ x: 200 }, { y: 300, action: 'fly' }], showRuler: true });

    expect(token.move).toHaveBeenCalledWith([{ x: 200 }, { y: 300, action: 'fly' }], {
      constrainOptions: { ignoreWalls: false, ignoreCost: false },
      autoRotate: false,
      showRuler: true
    });
    expect(result).toEqual({ sceneId: 'keep', tokenId: 't1', state: 'completed', movementId: 'mv1', userId: 'gm', x: 200, y: 300, elevation: 0, moved: true, arrived: true });
  });

  it('refuses the core movement commands below Foundry 13', async () => {
    const { deps } = setup(12);
    await expect(createMoveTokenPathHandler(deps)({ tokenId: 't1', waypoints: [{ x: 1 }] })).rejects.toThrow(
      'Core token movement requires Foundry 13 or newer'
    );
  });

  it('rejects an invalid path and reports a missing token', async () => {
    const { deps } = setup();
    await expect(createMoveTokenPathHandler(deps)({ tokenId: 't1', waypoints: [] })).rejects.toThrow('waypoints');
    await expect(createStopTokenMovementHandler(deps)({ tokenId: 'ghost' })).rejects.toThrow('Token not found: ghost');
  });

  it('stops, pauses and resumes', async () => {
    const { deps, token } = setup();

    expect(await createStopTokenMovementHandler(deps)({ tokenId: 't1' })).toMatchObject({ stopped: false, state: 'completed' });
    expect(await createPauseTokenMovementHandler(deps)({ tokenId: 't1' })).toMatchObject({ paused: false, key: 'foundry-api-bridge' });
    await expect(createResumeTokenMovementHandler(deps)({ tokenId: 't1' })).rejects.toThrow('Token t1 has no movement to resume');
    expect(await createResumeTokenMovementHandler(deps)({ tokenId: 't1', movementId: 'mv1', key: 'trap' })).toMatchObject({ requested: true });
    expect(token.resumeMovement).toHaveBeenCalledWith('mv1', 'trap');
  });

  it('measures a path from the token', async () => {
    const { deps } = setup();
    expect(await createMeasureTokenPathHandler(deps)({ tokenId: 't1', waypoints: [{ x: 200 }] })).toEqual({
      sceneId: 'keep',
      tokenId: 't1',
      distance: 10,
      cost: 10,
      spaces: 2,
      diagonals: 0,
      units: 'ft',
      segments: [{ distance: 10, cost: 10, spaces: 2, diagonals: 0 }],
      costBasis: 'distance'
    });
  });

  it('needs the token on the canvas to find a path', async () => {
    const { deps } = setup();
    await expect(createFindTokenPathHandler(deps)({ tokenId: 't1', waypoints: [{ x: 200 }] })).rejects.toThrow('Token not found on canvas: t1');
  });

  it('reads, reverts and clears the movement history', async () => {
    const { deps, token } = setup();

    expect(await createGetTokenMovementHistoryHandler(deps)({ tokenId: 't1' })).toEqual({
      sceneId: 'keep',
      tokenId: 't1',
      waypoints: [{ x: 100, y: 100, elevation: 0, action: 'walk', movementId: 'm1', userId: 'gm', cost: 5, checkpoint: true, explicit: false, snapped: false }],
      cost: 5,
      movementIds: ['m1']
    });
    expect(await createRevertTokenMovementHandler(deps)({ tokenId: 't1' })).toMatchObject({ reverted: true });
    expect(token.revertRecordedMovement).toHaveBeenCalledWith('m1');
    expect(await createClearTokenMovementHistoryHandler(deps)({ tokenId: 't1' })).toEqual({ scope: 'token', sceneId: 'keep', combatId: null, tokenIds: ['t1'] });
    await expect(createClearTokenMovementHistoryHandler(deps)({ combatId: 'c9' })).rejects.toThrow('Combat not found: c9');
  });
});
