import { TokenNotFoundError } from '../../domain';
import { FoundryCoreTokenMovement, MOVE_WAIT_MS } from '../FoundryCoreTokenMovement';
import type { FoundryMovableToken, FoundryMovementGame, FoundryMovementScene } from '../foundryMovementTypes';

function movableToken(overrides: Partial<FoundryMovableToken> = {}): FoundryMovableToken {
  return {
    id: 't1',
    x: 100,
    y: 100,
    elevation: 0,
    movement: { id: '', state: 'completed', user: { id: 'gm', name: 'Gamemaster', isSelf: true } },
    _source: { _movementHistory: [] },
    object: null,
    move: jest.fn().mockResolvedValue(true),
    stopMovement: jest.fn().mockReturnValue(true),
    pauseMovement: jest.fn().mockReturnValue(Promise.resolve(true)),
    resumeMovement: jest.fn(),
    measureMovementPath: jest.fn().mockReturnValue({
      distance: 10,
      cost: 10,
      spaces: 2,
      diagonals: 0,
      segments: [{ distance: 10, cost: 10, spaces: 2, diagonals: 0 }]
    }),
    revertRecordedMovement: jest.fn().mockResolvedValue(true),
    clearMovementHistory: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function setup(token: FoundryMovableToken, generation = 13, wait?: (ms: number) => Promise<void>): {
  movement: FoundryCoreTokenMovement;
  scene: FoundryMovementScene;
  combat: { combatants: { contents: Array<{ token?: FoundryMovableToken | null }> }; clearMovementHistories: jest.Mock };
} {
  const other = movableToken({ id: 't2', _source: { _movementHistory: [] } });
  const scene: FoundryMovementScene = {
    id: 'keep',
    grid: { units: 'ft' },
    tokens: { get: (id) => [token, other].find((candidate) => candidate.id === id), contents: [token, other] },
    clearMovementHistories: jest.fn().mockResolvedValue(undefined)
  };
  const combat = { combatants: { contents: [{ token }, { token: null }, { token: other }] }, clearMovementHistories: jest.fn().mockResolvedValue(undefined) };
  const game: FoundryMovementGame = {
    scenes: { get: (id) => (id === 'keep' ? scene : undefined), active: scene },
    combats: { get: (id) => (id === 'c1' ? combat : undefined) }
  };
  const movement = new FoundryCoreTokenMovement(
    { getGame: () => game },
    () => ({ CONFIG: { Token: { movement: { actions: { walk: {}, fly: {} } } } } }),
    () => generation,
    wait
  );
  return { movement, scene, combat };
}

describe('FoundryCoreTokenMovement', () => {
  it('is available from Foundry 13 on', () => {
    const token = movableToken();
    expect(setup(token, 12).movement.isAvailable()).toBe(false);
    expect(setup(token, 13).movement.isAvailable()).toBe(true);
    expect(setup(token, 0).movement.isAvailable()).toBe(true);
    expect(setup(token).movement.movementActions()).toEqual(['walk', 'fly']);
  });

  it('reports the movement state and whether it was started here', () => {
    const token = movableToken({ movement: { id: 'mv1', state: 'paused', user: { id: 'p1', name: 'Alice', isSelf: false } } });
    expect(setup(token).movement.status('keep', 't1')).toEqual({
      x: 100,
      y: 100,
      elevation: 0,
      state: 'paused',
      movementId: 'mv1',
      userId: 'p1',
      userName: 'Alice',
      startedHere: false
    });
    expect(setup(movableToken()).movement.status('keep', 'ghost')).toBeNull();
    expect(setup(movableToken()).movement.status('keep', 't1')?.movementId).toBeNull();
  });

  it('moves through the waypoints with the constrain options', async () => {
    const token = movableToken();
    await setup(token).movement.move('keep', 't1', [{ x: 200, action: 'fly', y: undefined }], {
      ignoreWalls: true,
      ignoreCost: false,
      autoRotate: true,
      showRuler: false
    });

    expect(token.move).toHaveBeenCalledWith([{ x: 200, action: 'fly' }], {
      constrainOptions: { ignoreWalls: true, ignoreCost: false },
      autoRotate: true,
      showRuler: false
    });
  });

  it('stops waiting for a movement that has not settled after the bounded wait', async () => {
    const token = movableToken({ move: jest.fn(() => new Promise<boolean>(() => undefined)) });
    const wait = jest.fn(() => Promise.resolve());

    await setup(token, 14, wait).movement.move('keep', 't1', [{ x: 300 }], {
      ignoreWalls: false,
      ignoreCost: false,
      autoRotate: false,
      showRuler: false
    });

    expect(wait).toHaveBeenCalledWith(MOVE_WAIT_MS, expect.any(AbortSignal));
  });

  it('cancels the bounded wait once the movement has settled', async () => {
    jest.useFakeTimers();
    try {
      await setup(movableToken()).movement.move('keep', 't1', [{ x: 300 }], {
        ignoreWalls: false,
        ignoreCost: false,
        autoRotate: false,
        showRuler: false
      });

      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('pauses with a key, and treats a repeated pause as paused', () => {
    const token = movableToken();
    const { movement } = setup(token);
    expect(movement.pause('keep', 't1', 'k')).toBe(true);
    expect(token.pauseMovement).toHaveBeenCalledWith('k');

    const again = movableToken({
      movement: { id: 'mv', state: 'paused', user: { id: 'gm', isSelf: true } },
      pauseMovement: jest.fn(() => {
        throw new Error('already called with key');
      })
    });
    expect(setup(again).movement.pause('keep', 't1', 'k')).toBe(true);
    expect(setup(movableToken({ pauseMovement: jest.fn().mockReturnValue(null) })).movement.pause('keep', 't1', 'k')).toBe(false);
  });

  it('measures from the token with the terrain rules when the token is on the canvas', () => {
    const placeable = {
      measureMovementPath: jest.fn().mockReturnValue({ distance: 15, cost: Infinity, spaces: 3, diagonals: 1, segments: [{ distance: 15, cost: Infinity, spaces: 3, diagonals: 1 }] }),
      findMovementPath: jest.fn()
    };
    const onCanvas = movableToken({ object: placeable });
    expect(setup(onCanvas).movement.measure('keep', 't1', [{ x: 300 }])).toEqual({
      distance: 15,
      cost: null,
      spaces: 3,
      diagonals: 1,
      segments: [{ distance: 15, cost: null, spaces: 3, diagonals: 1 }],
      costBasis: 'terrain'
    });
    expect(placeable.measureMovementPath).toHaveBeenCalledWith([{}, { x: 300 }]);

    const offCanvas = movableToken();
    expect(setup(offCanvas).movement.measure('keep', 't1', [{ x: 300 }]).costBasis).toBe('distance');
    expect(offCanvas.measureMovementPath).toHaveBeenCalledWith([{}, { x: 300 }]);
  });

  it('asks the pathfinder from the token position, with the options each generation expects', async () => {
    const path = [{ x: 100, y: 100, elevation: 0, action: 'walk', snapped: true }, { x: 200, y: 100, elevation: 0, action: 'walk' }];
    const placeable = { measureMovementPath: jest.fn(), findMovementPath: jest.fn().mockReturnValue({ promise: Promise.resolve(path) }) };
    const token = movableToken({ object: placeable });

    await expect(setup(token, 13).movement.findPath('keep', 't1', [{ x: 300 }], { ignoreWalls: false, ignoreCost: true })).resolves.toEqual([
      { x: 100, y: 100, elevation: 0, action: 'walk' },
      { x: 200, y: 100, elevation: 0, action: 'walk' }
    ]);
    expect(placeable.findMovementPath).toHaveBeenLastCalledWith(
      [{ x: 100, y: 100, elevation: 0 }, { x: 300 }],
      { ignoreWalls: false, ignoreCost: true, history: false }
    );

    await setup(token, 14).movement.findPath('keep', 't1', [{ x: 300 }], { ignoreWalls: false, ignoreCost: true });
    expect(placeable.findMovementPath).toHaveBeenLastCalledWith(expect.any(Array), {
      constrainOptions: { ignoreWalls: false, ignoreCost: true, history: false }
    });
    expect(setup(movableToken()).movement.canFindPath('keep', 't1')).toBe(false);
  });

  it('reads the recorded history, an infinite cost as null', () => {
    const token = movableToken({
      _source: {
        _movementHistory: [
          { x: 100, y: 100, elevation: 0, action: 'walk', movementId: 'm1', userId: 'gm', cost: 5, checkpoint: true, snapped: true },
          { x: 150, y: 100, elevation: 0, action: 'walk', movementId: 'm1', userId: 'gm', cost: null, intermediate: true }
        ]
      }
    });
    expect(setup(token).movement.history('keep', 't1')).toEqual([
      { x: 100, y: 100, elevation: 0, action: 'walk', movementId: 'm1', userId: 'gm', cost: 5, checkpoint: true, explicit: false, snapped: true, intermediate: false },
      { x: 150, y: 100, elevation: 0, action: 'walk', movementId: 'm1', userId: 'gm', cost: null, checkpoint: false, explicit: false, snapped: false, intermediate: true }
    ]);
  });

  it('clears the histories of a scene and of a combat, reporting the tokens that had one', async () => {
    const token = movableToken({ _source: { _movementHistory: [{ x: 1, y: 1, elevation: 0, action: 'walk', movementId: 'm' }] } });
    const { movement, scene, combat } = setup(token);

    await expect(movement.clearScene('keep')).resolves.toEqual(['t1']);
    expect(scene.clearMovementHistories).toHaveBeenCalled();
    expect(movement.hasCombat('c1')).toBe(true);
    await expect(movement.clearCombat('c1')).resolves.toEqual(['t1']);
    expect(combat.clearMovementHistories).toHaveBeenCalled();
    await expect(movement.clearCombat('ghost')).resolves.toEqual([]);
  });

  it('fails with the domain error for a token that is gone', () => {
    expect(() => setup(movableToken()).movement.stop('keep', 'ghost')).toThrow(TokenNotFoundError);
  });
});
