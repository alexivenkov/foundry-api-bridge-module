import { CoreFeatureUnavailableError, NoActiveSceneError } from '../../../shared';
import {
  HistoryScopeConflictError,
  MovementCombatNotFoundError,
  MovementStartedElsewhereError,
  NoTokenMovementError,
  RecordedMovementNotFoundError,
  TokenNotFoundError,
  TokenNotOnCanvasError,
  type CoreMovementOptions,
  type CoreMovementWaypoint,
  type CoreTokenMovement,
  type MovementHistoryEntry,
  type PathMeasurement,
  type PathWaypoint,
  type TokenMovementHistory,
  type TokenMovementStatus
} from '../../domain';
import { TokenCoreMovementService } from '../TokenCoreMovementService';
import { FakeSceneLocator } from './fakePorts';

const OPTIONS: CoreMovementOptions = { ignoreWalls: false, ignoreCost: false, autoRotate: false, showRuler: false };

function entry(movementId: string, cost: number | null = 5, intermediate = false): MovementHistoryEntry {
  return { x: 0, y: 0, elevation: 0, action: 'walk', movementId, userId: 'gm', cost, checkpoint: false, explicit: false, snapped: true, intermediate };
}

class FakeMovement implements CoreTokenMovement, TokenMovementHistory {
  available = true;
  onCanvas = true;
  status_: TokenMovementStatus = { x: 100, y: 100, elevation: 0, state: 'completed', movementId: null, userId: 'gm', userName: 'GM', startedHere: true };
  destination: { x: number; y: number; elevation: number } | null = null;
  entries: MovementHistoryEntry[] = [entry('m1'), entry('m1', 5, true), entry('m2', 10)];
  readonly calls: string[] = [];

  isAvailable(): boolean {
    return this.available;
  }
  movementActions(): readonly string[] | null {
    return ['walk', 'fly'];
  }
  status(_sceneId: string, tokenId: string): TokenMovementStatus | null {
    return tokenId === 't1' ? this.status_ : null;
  }
  move(_sceneId: string, _tokenId: string, _waypoints: readonly CoreMovementWaypoint[], _options: CoreMovementOptions): Promise<void> {
    this.calls.push('move');
    if (this.destination) {
      this.status_ = { ...this.status_, ...this.destination };
    }
    return Promise.resolve();
  }
  stop(): boolean {
    this.calls.push('stop');
    return true;
  }
  pause(_sceneId: string, _tokenId: string, key: string): boolean {
    this.calls.push(`pause:${key}`);
    return true;
  }
  resume(_sceneId: string, _tokenId: string, movementId: string, key: string): void {
    this.calls.push(`resume:${movementId}:${key}`);
  }
  measure(): PathMeasurement {
    return { distance: 10, cost: 10, spaces: 2, diagonals: 0, segments: [], costBasis: 'distance' };
  }
  canFindPath(): boolean {
    return this.onCanvas;
  }
  findPath(): Promise<readonly PathWaypoint[]> {
    return Promise.resolve([
      { x: 100, y: 100, elevation: 0, action: 'walk' },
      { x: 200, y: 100, elevation: 0, action: 'walk' }
    ]);
  }
  units(): string {
    return 'ft';
  }
  history(): readonly MovementHistoryEntry[] {
    return this.entries;
  }
  revert(_sceneId: string, _tokenId: string, movementId: string): Promise<boolean> {
    this.calls.push(`revert:${movementId}`);
    return Promise.resolve(true);
  }
  clearToken(): Promise<void> {
    this.calls.push('clear-token');
    return Promise.resolve();
  }
  clearScene(): Promise<readonly string[]> {
    return Promise.resolve(['t1']);
  }
  hasCombat(combatId: string): boolean {
    return combatId === 'c1';
  }
  clearCombat(): Promise<readonly string[]> {
    return Promise.resolve(['t1', 't2']);
  }
}

function setup(active: string | null = 'keep'): { service: TokenCoreMovementService; movement: FakeMovement } {
  const movement = new FakeMovement();
  return {
    service: new TokenCoreMovementService({ scenes: new FakeSceneLocator(['keep'], active), movement, history: movement }),
    movement
  };
}

describe('TokenCoreMovementService', () => {
  it('refuses every command below Foundry 13', async () => {
    const { service, movement } = setup();
    movement.available = false;
    const refusal = new CoreFeatureUnavailableError('Core token movement requires Foundry 13 or newer');

    await expect(service.moveAlongPath({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 1 }], options: OPTIONS })).rejects.toThrow(refusal);
    expect(() => service.measure({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 1 }] })).toThrow(refusal);
    await expect(service.clearHistory({ sceneId: undefined, tokenId: undefined, combatId: undefined })).rejects.toThrow(refusal);
    expect(movement.calls).toEqual([]);
  });

  it('resolves the scene and the token first', async () => {
    await expect(setup(null).service.moveAlongPath({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 1 }], options: OPTIONS })).rejects.toThrow(
      NoActiveSceneError
    );
    expect(() => setup().service.stop({ sceneId: undefined, tokenId: 'ghost' })).toThrow(TokenNotFoundError);
  });

  it('reports whether the token moved and arrived at the last waypoint', async () => {
    const { service, movement } = setup();
    movement.destination = { x: 200, y: 300, elevation: 10 };

    const arrived = await service.moveAlongPath({
      sceneId: 'keep',
      tokenId: 't1',
      waypoints: [{ x: 200 }, { y: 300, elevation: 10, action: 'fly' }],
      options: OPTIONS
    });
    expect(arrived).toMatchObject({ moved: true, arrived: true, status: { x: 200, y: 300 } });

    movement.destination = { x: 150, y: 100, elevation: 0 };
    const stoppedEarly = await service.moveAlongPath({ sceneId: 'keep', tokenId: 't1', waypoints: [{ x: 400 }], options: OPTIONS });
    expect(stoppedEarly).toMatchObject({ moved: true, arrived: false });
  });

  it('refuses an unknown movement action', async () => {
    const { service, movement } = setup();
    await expect(
      service.moveAlongPath({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 1, action: 'teleport' }], options: OPTIONS })
    ).rejects.toThrow('Unknown movement action: teleport. Known: walk, fly');
    expect(movement.calls).toEqual([]);
  });

  it('refuses to stop or pause a movement another user started', () => {
    const { service, movement } = setup();
    movement.status_ = { ...movement.status_, state: 'pending', movementId: 'mv', startedHere: false, userName: 'Alice' };

    expect(() => service.stop({ sceneId: undefined, tokenId: 't1' })).toThrow(new MovementStartedElsewhereError('stop', 'Alice'));
    expect(() => service.pause({ sceneId: undefined, tokenId: 't1', key: 'k' })).toThrow(
      'Only the user who started the movement can pause it (started by Alice)'
    );
    expect(movement.calls).toEqual([]);
  });

  it('leaves a finished movement alone, whoever started it', () => {
    const { service, movement } = setup();
    movement.status_ = { ...movement.status_, state: 'completed', startedHere: false };
    expect(service.stop({ sceneId: undefined, tokenId: 't1' }).done).toBe(false);
    expect(service.pause({ sceneId: undefined, tokenId: 't1', key: 'k' }).done).toBe(false);

    movement.status_ = { ...movement.status_, state: 'stopped' };
    expect(service.stop({ sceneId: undefined, tokenId: 't1' }).done).toBe(true);
    expect(movement.calls).toEqual([]);
  });

  it('stops and pauses a movement started here', () => {
    const { service, movement } = setup();
    movement.status_ = { ...movement.status_, state: 'pending', movementId: 'mv' };

    expect(service.stop({ sceneId: undefined, tokenId: 't1' }).done).toBe(true);
    expect(service.pause({ sceneId: undefined, tokenId: 't1', key: 'trap' }).done).toBe(true);
    expect(movement.calls).toEqual(['stop', 'pause:trap']);
  });

  it('resumes the current movement by default and refuses when there is none', () => {
    const { service, movement } = setup();
    expect(() => service.resume({ sceneId: undefined, tokenId: 't1', movementId: undefined, key: 'k' })).toThrow(NoTokenMovementError);

    movement.status_ = { ...movement.status_, state: 'paused', movementId: 'mv' };
    service.resume({ sceneId: undefined, tokenId: 't1', movementId: undefined, key: 'k' });
    service.resume({ sceneId: undefined, tokenId: 't1', movementId: 'other', key: 'k' });
    expect(movement.calls).toEqual(['resume:mv:k', 'resume:other:k']);
  });

  it('measures with the scene units', () => {
    expect(setup().service.measure({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 200 }] })).toMatchObject({
      sceneId: 'keep',
      units: 'ft',
      measurement: { distance: 10 }
    });
  });

  it('finds a path only for a token on the canvas and tells whether it is complete', async () => {
    const { service, movement } = setup();
    await expect(service.findPath({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 200 }], options: OPTIONS })).resolves.toMatchObject({
      complete: true
    });
    await expect(service.findPath({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 500 }], options: OPTIONS })).resolves.toMatchObject({
      complete: false
    });
    movement.onCanvas = false;
    await expect(service.findPath({ sceneId: undefined, tokenId: 't1', waypoints: [{ x: 200 }], options: OPTIONS })).rejects.toThrow(
      TokenNotOnCanvasError
    );
  });

  it('reports the history without intermediate waypoints but with their cost', () => {
    const result = setup().service.getHistory({ sceneId: undefined, tokenId: 't1' });
    expect(result.entries).toHaveLength(2);
    expect(result.cost).toBe(20);
    expect(result.movementIds).toEqual(['m1', 'm2']);
  });

  it('reverts the last recorded movement by default, and refuses one that is not recorded', async () => {
    const { service, movement } = setup();

    await expect(service.revert({ sceneId: undefined, tokenId: 't1', movementId: undefined })).resolves.toMatchObject({ done: true });
    await service.revert({ sceneId: undefined, tokenId: 't1', movementId: 'm1' });
    await expect(service.revert({ sceneId: undefined, tokenId: 't1', movementId: 'm9' })).rejects.toThrow(
      new RecordedMovementNotFoundError('m9')
    );
    expect(movement.calls).toEqual(['revert:m2', 'revert:m1']);

    movement.entries = [];
    await expect(service.revert({ sceneId: undefined, tokenId: 't1', movementId: undefined })).resolves.toMatchObject({ done: false });
  });

  it('clears the history of a token, a scene or a combat', async () => {
    const { service, movement } = setup();

    await expect(service.clearHistory({ sceneId: undefined, tokenId: 't1', combatId: undefined })).resolves.toEqual({
      scope: 'token',
      sceneId: 'keep',
      combatId: null,
      tokenIds: ['t1']
    });
    await expect(service.clearHistory({ sceneId: 'keep', tokenId: undefined, combatId: undefined })).resolves.toMatchObject({
      scope: 'scene',
      tokenIds: ['t1']
    });
    await expect(service.clearHistory({ sceneId: undefined, tokenId: undefined, combatId: 'c1' })).resolves.toEqual({
      scope: 'combat',
      sceneId: null,
      combatId: 'c1',
      tokenIds: ['t1', 't2']
    });
    expect(movement.calls).toEqual(['clear-token']);

    movement.entries = [];
    await expect(service.clearHistory({ sceneId: undefined, tokenId: 't1', combatId: undefined })).resolves.toMatchObject({ tokenIds: [] });
  });

  it('refuses an unknown combat or two scopes at once', async () => {
    const { service } = setup();
    await expect(service.clearHistory({ sceneId: undefined, tokenId: undefined, combatId: 'c9' })).rejects.toThrow(
      new MovementCombatNotFoundError('c9')
    );
    await expect(service.clearHistory({ sceneId: undefined, tokenId: 't1', combatId: 'c1' })).rejects.toThrow(HistoryScopeConflictError);
    await expect(service.clearHistory({ sceneId: undefined, tokenId: 'ghost', combatId: undefined })).rejects.toThrow(TokenNotFoundError);
  });
});
