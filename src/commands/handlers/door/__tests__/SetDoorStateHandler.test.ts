import { setDoorStateHandler } from '../SetDoorStateHandler';

interface MockWall {
  _id: string;
  c: number[];
  door: number;
  ds: number;
  move: number;
  sense: number;
  update: jest.Mock;
}

interface MockScene {
  id: string;
  name: string;
  walls: {
    get: jest.Mock;
    contents: MockWall[];
  };
}

const createMockWall = (overrides: Partial<MockWall> = {}): MockWall => {
  const wall: MockWall = {
    _id: 'wall-001',
    c: [0, 0, 100, 0],
    door: 1,
    ds: 0,
    move: 20,
    sense: 20,
    update: jest.fn(),
    ...overrides
  };
  wall.update.mockResolvedValue(wall);
  return wall;
};

const createMockScene = (): MockScene => {
  const wall = createMockWall();
  return {
    id: 'scene-001',
    name: 'Test Scene',
    walls: {
      get: jest.fn().mockReturnValue(wall),
      contents: [wall]
    }
  };
};

const mockGame = {
  scenes: {
    get: jest.fn() as jest.Mock,
    active: null as MockScene | null
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('setDoorStateHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = createMockScene();
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('opens a closed door', async () => {
    const result = await setDoorStateHandler({
      wallId: 'wall-001',
      state: 1
    });

    const wall = mockGame.scenes.active!.walls.get('wall-001') as MockWall;
    expect(wall.update).toHaveBeenCalledWith({ ds: 1 });
    expect(result).toEqual({
      wallId: 'wall-001',
      door: 1,
      previousState: 0,
      newState: 1
    });
  });

  it('closes an open door', async () => {
    const openWall = createMockWall({ ds: 1 });
    mockGame.scenes.active!.walls.get.mockReturnValue(openWall);

    const result = await setDoorStateHandler({
      wallId: 'wall-001',
      state: 0
    });

    expect(openWall.update).toHaveBeenCalledWith({ ds: 0 });
    expect(result.previousState).toBe(1);
    expect(result.newState).toBe(0);
  });

  it('locks a door', async () => {
    const result = await setDoorStateHandler({
      wallId: 'wall-001',
      state: 2
    });

    const wall = mockGame.scenes.active!.walls.get('wall-001') as MockWall;
    expect(wall.update).toHaveBeenCalledWith({ ds: 2 });
    expect(result.newState).toBe(2);
  });

  it('unlocks a locked door', async () => {
    const lockedWall = createMockWall({ ds: 2 });
    mockGame.scenes.active!.walls.get.mockReturnValue(lockedWall);

    const result = await setDoorStateHandler({
      wallId: 'wall-001',
      state: 0
    });

    expect(lockedWall.update).toHaveBeenCalledWith({ ds: 0 });
    expect(result.previousState).toBe(2);
    expect(result.newState).toBe(0);
  });

  it('throws for non-existent wall', async () => {
    mockGame.scenes.active!.walls.get.mockReturnValue(undefined);

    await expect(setDoorStateHandler({
      wallId: 'nonexistent',
      state: 1
    })).rejects.toThrow('Wall not found: nonexistent');
  });

  it('throws when wall is not a door', async () => {
    const plainWall = createMockWall({ door: 0 });
    mockGame.scenes.active!.walls.get.mockReturnValue(plainWall);

    await expect(setDoorStateHandler({
      wallId: 'wall-001',
      state: 1
    })).rejects.toThrow('Wall wall-001 is not a door');
  });

  it('throws for invalid state value', async () => {
    await expect(setDoorStateHandler({
      wallId: 'wall-001',
      state: 3
    })).rejects.toThrow('Invalid door state: 3');

    await expect(setDoorStateHandler({
      wallId: 'wall-001',
      state: -1
    })).rejects.toThrow('Invalid door state: -1');
  });

  it('works with explicit sceneId', async () => {
    const specificScene = createMockScene();
    specificScene.id = 'specific-scene';
    mockGame.scenes.get.mockReturnValue(specificScene);

    await setDoorStateHandler({
      sceneId: 'specific-scene',
      wallId: 'wall-001',
      state: 1
    });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
  });

  it('works with active scene when no sceneId', async () => {
    await setDoorStateHandler({
      wallId: 'wall-001',
      state: 1
    });

    expect(mockGame.scenes.get).not.toHaveBeenCalled();
  });

  it('throws when no active scene and no sceneId', async () => {
    mockGame.scenes.active = null;

    await expect(setDoorStateHandler({
      wallId: 'wall-001',
      state: 1
    })).rejects.toThrow('No active scene');
  });

  it('handles secret doors', async () => {
    const secretDoor = createMockWall({ door: 2, ds: 0 });
    mockGame.scenes.active!.walls.get.mockReturnValue(secretDoor);

    const result = await setDoorStateHandler({
      wallId: 'wall-001',
      state: 1
    });

    expect(secretDoor.update).toHaveBeenCalledWith({ ds: 1 });
    expect(result.door).toBe(2);
  });
});
