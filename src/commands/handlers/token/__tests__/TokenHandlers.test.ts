import { createTokenHandler } from '@/commands';
import { deleteTokenHandler } from '@/commands';
import { moveTokenHandler } from '@/commands';
import { updateTokenHandler } from '@/commands';
import { getSceneTokensHandler } from '@/commands';

interface MockToken {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elevation: number;
  rotation: number;
  hidden: boolean;
  texture: {
    src: string;
  };
  disposition: number;
  actor: {
    id: string;
    system?: { attributes?: { hp?: { value: number; max: number }; ac?: { value: number } } };
    statuses?: Set<string>;
  } | null;
  update: jest.Mock;
  delete: jest.Mock;
}

interface MockScene {
  id: string;
  name: string;
  tokens: {
    get: jest.Mock;
    contents: MockToken[];
  };
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

const createMockToken = (overrides: Partial<MockToken> = {}): MockToken => {
  const token: MockToken = {
    id: 'token-123',
    name: 'Test Token',
    x: 100,
    y: 200,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: {
      src: 'icons/token.png'
    },
    disposition: 1,
    actor: {
      id: 'actor-456',
      system: {
        attributes: {
          hp: { value: 25, max: 30 },
          ac: { value: 15 }
        }
      },
      statuses: new Set<string>()
    },
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
  token.update.mockImplementation((data) => Promise.resolve({ ...token, ...data }));
  token.delete.mockResolvedValue(token);
  return token;
};

const createMockScene = (overrides: Partial<MockScene> = {}): MockScene => {
  const mockToken = createMockToken();
  const baseScene: MockScene = {
    id: 'scene-123',
    name: 'Test Scene',
    tokens: {
      get: jest.fn().mockReturnValue(mockToken),
      contents: [mockToken]
    },
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  };

  return { ...baseScene, ...overrides };
};

const mockGame: {
  scenes: {
    get: jest.Mock;
    active: MockScene | null;
  };
} = {
  scenes: {
    get: jest.fn(),
    active: null
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('Token Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
  });

  describe('createTokenHandler', () => {
    it('creates token on active scene', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.createEmbeddedDocuments.mockResolvedValue([mockToken]);
      mockGame.scenes.active = mockScene;

      const result = await createTokenHandler({
        actorId: 'actor-456',
        x: 100,
        y: 200
      });

      expect(mockScene.createEmbeddedDocuments).toHaveBeenCalledWith('Token', [{
        actorId: 'actor-456',
        x: 100,
        y: 200
      }]);
      expect(result).toEqual({
        id: 'token-123',
        name: 'Test Token',
        actorId: 'actor-456',
        x: 100,
        y: 200,
        width: 1,
        height: 1,
        elevation: 0,
        rotation: 0,
        hidden: false,
        img: 'icons/token.png',
        disposition: 1,
        hp: { value: 25, max: 30 },
        ac: 15,
        conditions: []
      });
    });

    it('creates token on specific scene', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene({ id: 'specific-scene' });
      mockScene.createEmbeddedDocuments.mockResolvedValue([mockToken]);
      mockGame.scenes.get.mockReturnValue(mockScene);

      const result = await createTokenHandler({
        sceneId: 'specific-scene',
        actorId: 'actor-456',
        x: 100,
        y: 200
      });

      expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
      expect(result.id).toBe('token-123');
    });

    it('creates token with optional properties', async () => {
      const mockToken = createMockToken({ hidden: true, elevation: 10, rotation: 45 });
      const mockScene = createMockScene();
      mockScene.createEmbeddedDocuments.mockResolvedValue([mockToken]);
      mockGame.scenes.active = mockScene;

      await createTokenHandler({
        actorId: 'actor-456',
        x: 100,
        y: 200,
        hidden: true,
        elevation: 10,
        rotation: 45,
        scale: 1.5
      });

      expect(mockScene.createEmbeddedDocuments).toHaveBeenCalledWith('Token', [{
        actorId: 'actor-456',
        x: 100,
        y: 200,
        hidden: true,
        elevation: 10,
        rotation: 45,
        scale: 1.5
      }]);
    });

    it('throws error when no active scene', async () => {
      mockGame.scenes.active = null;

      await expect(createTokenHandler({
        actorId: 'actor-456',
        x: 100,
        y: 200
      })).rejects.toThrow('No active scene');
    });

    it('throws error when scene not found', async () => {
      mockGame.scenes.get.mockReturnValue(undefined);

      await expect(createTokenHandler({
        sceneId: 'nonexistent',
        actorId: 'actor-456',
        x: 100,
        y: 200
      })).rejects.toThrow('Scene not found: nonexistent');
    });

    it('throws error when token creation fails', async () => {
      const mockScene = createMockScene();
      mockScene.createEmbeddedDocuments.mockResolvedValue([]);
      mockGame.scenes.active = mockScene;

      await expect(createTokenHandler({
        actorId: 'actor-456',
        x: 100,
        y: 200
      })).rejects.toThrow('Failed to create token');
    });
  });

  describe('deleteTokenHandler', () => {
    it('deletes token from active scene', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      const result = await deleteTokenHandler({
        tokenId: 'token-123'
      });

      expect(mockToken.delete).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });

    it('deletes token from specific scene', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.get.mockReturnValue(mockScene);

      const result = await deleteTokenHandler({
        sceneId: 'specific-scene',
        tokenId: 'token-123'
      });

      expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
      expect(mockToken.delete).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });

    it('throws error when token not found', async () => {
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(undefined);
      mockGame.scenes.active = mockScene;

      await expect(deleteTokenHandler({
        tokenId: 'nonexistent'
      })).rejects.toThrow('Token not found: nonexistent');
    });
  });

  describe('moveTokenHandler', () => {
    it('moves token to new position', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      const result = await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 400
      });

      expect(mockToken.update).toHaveBeenCalledWith(
        { x: 300, y: 400 },
        { animate: true }
      );
      expect(result.x).toBe(300);
      expect(result.y).toBe(400);
    });

    it('moves token with elevation and rotation', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 400,
        elevation: 20,
        rotation: 90
      });

      expect(mockToken.update).toHaveBeenCalledWith(
        { x: 300, y: 400, elevation: 20, rotation: 90 },
        { animate: true }
      );
    });

    it('moves token without animation', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 400,
        animate: false
      });

      expect(mockToken.update).toHaveBeenCalledWith(
        { x: 300, y: 400 },
        { animate: false }
      );
    });

    it('throws error when token not found', async () => {
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(undefined);
      mockGame.scenes.active = mockScene;

      await expect(moveTokenHandler({
        tokenId: 'nonexistent',
        x: 300,
        y: 400
      })).rejects.toThrow('Token not found: nonexistent');
    });

    it('uses direct move when collision backend is unavailable', async () => {
      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      const result = await moveTokenHandler({
        tokenId: 'token-123',
        x: 500,
        y: 600
      });

      expect(mockToken.update).toHaveBeenCalledTimes(1);
      expect(result.x).toBe(500);
    });

    it('uses direct move when path is clear', async () => {
      const mockCollision = {
        testCollision: jest.fn().mockReturnValue(false)
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100 });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 100
      });

      expect(mockToken.update).toHaveBeenCalledTimes(1);
      expect(mockToken.update).toHaveBeenCalledWith(
        { x: 300, y: 100 },
        { animate: true }
      );

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    it('uses pathfinding when direct path is blocked', async () => {
      const mockCollision = {
        testCollision: jest.fn((origin: { x: number; y: number }, dest: { x: number; y: number }) => {
          if (origin.x === 150 && origin.y === 150 && dest.x === 350 && dest.y === 150) return true;
          if (origin.x === 150 && dest.x === 250 && origin.y === 150 && dest.y === 150) return true;
          return false;
        })
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100 });
      // Update mutates the token so re-fetch returns current state
      mockToken.update.mockImplementation((data) => {
        Object.assign(mockToken, data);
        return Promise.resolve(mockToken);
      });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockImplementation(() => mockToken);
      mockGame.scenes.active = mockScene;

      const result = await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 100
      });

      expect(mockToken.update.mock.calls.length).toBeGreaterThan(1);
      expect(result.x).toBe(300);
      expect(result.y).toBe(100);
      expect(result.pathCost).toBeGreaterThan(0);

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    it('does not include pathCost for direct moves', async () => {
      const mockCollision = {
        testCollision: jest.fn().mockReturnValue(false)
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100 });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      const result = await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 100
      });

      expect(result.pathCost).toBeUndefined();

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    it('throws error when path is completely blocked', async () => {
      // Block ALL movement from starting cell
      const mockCollision = {
        testCollision: jest.fn().mockReturnValue(true)
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100 });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      await expect(moveTokenHandler({
        tokenId: 'token-123',
        x: 500,
        y: 500
      })).rejects.toThrow('Path blocked');

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    it('applies elevation and rotation to last waypoint in path', async () => {
      const mockCollision = {
        testCollision: jest.fn((origin: { x: number; y: number }, dest: { x: number; y: number }) => {
          if (Math.abs(dest.x - origin.x) > 150) return true;
          if (origin.x === 150 && dest.x === 250 && origin.y === 150 && dest.y === 150) return true;
          return false;
        })
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100 });
      mockToken.update.mockImplementation((data) => {
        Object.assign(mockToken, data);
        return Promise.resolve(mockToken);
      });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockImplementation(() => mockToken);
      mockGame.scenes.active = mockScene;

      await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 100,
        elevation: 10,
        rotation: 45
      });

      // Last update call should include elevation and rotation
      const calls = mockToken.update.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall?.[0]).toMatchObject({ elevation: 10, rotation: 45 });

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    it('only animates final waypoint in multi-step path', async () => {
      const mockCollision = {
        testCollision: jest.fn((origin: { x: number; y: number }, dest: { x: number; y: number }) => {
          if (origin.x === 150 && origin.y === 150 && dest.x === 350 && dest.y === 150) return true;
          if (origin.x === 150 && dest.x === 250 && origin.y === 150 && dest.y === 150) return true;
          return false;
        })
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100 });
      mockToken.update.mockImplementation((data) => {
        Object.assign(mockToken, data);
        return Promise.resolve(mockToken);
      });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockImplementation(() => mockToken);
      mockGame.scenes.active = mockScene;

      await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 100
      });

      const calls = mockToken.update.mock.calls;
      expect(calls.length).toBeGreaterThan(1);

      // All intermediate calls should have animate: false
      for (let i = 0; i < calls.length - 1; i++) {
        expect(calls[i]?.[1]).toEqual({ animate: false });
      }
      // Last call should have animate: true
      expect(calls[calls.length - 1]?.[1]).toEqual({ animate: true });

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    it('uses multi-cell collision check for large token', async () => {
      const mockCollision = {
        testCollision: jest.fn().mockReturnValue(false)
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100, width: 2, height: 2 });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      await moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 100
      });

      // 2x2 token: direct-path check should test all 4 cells of the footprint
      expect(mockCollision.testCollision.mock.calls.length).toBeGreaterThanOrEqual(4);

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    it('passes token dimensions to pathfinder when direct path blocked', async () => {
      const mockCollision = {
        testCollision: jest.fn((origin: { x: number; y: number }, dest: { x: number; y: number }) => {
          // Block direct path for any cell crossing from x<250 to x>=250
          if (origin.x < 250 && dest.x >= 250) return true;
          if (origin.x >= 250 && dest.x < 250) return true;
          return false;
        })
      };
      (global as Record<string, unknown>)['CONFIG'] = {
        Canvas: { polygonBackends: { move: mockCollision } }
      };
      (global as Record<string, unknown>)['canvas'] = {
        scene: { grid: { size: 100 } }
      };

      const mockToken = createMockToken({ x: 100, y: 100, width: 2, height: 2 });
      mockToken.update.mockImplementation((data) => {
        Object.assign(mockToken, data);
        return Promise.resolve(mockToken);
      });
      const mockScene = createMockScene();
      mockScene.tokens.get.mockImplementation(() => mockToken);
      mockGame.scenes.active = mockScene;

      // Destination is blocked by the barrier — should throw since barrier is infinite
      await expect(moveTokenHandler({
        tokenId: 'token-123',
        x: 300,
        y: 100
      })).rejects.toThrow('Path blocked');

      delete (global as Record<string, unknown>)['CONFIG'];
      delete (global as Record<string, unknown>)['canvas'];
    });

    describe('door-aware movement', () => {
      afterEach(() => {
        delete (global as Record<string, unknown>)['CONFIG'];
        delete (global as Record<string, unknown>)['canvas'];
      });

      function setupDoorScene(
        doorCollision: { testCollision: jest.Mock },
        tokenOverrides: Partial<MockToken> = {}
      ): { mockToken: MockToken; mockWall: { _id: string; c: number[]; door: number; ds: number | undefined; move: number; sense: number; update: jest.Mock } } {
        (global as Record<string, unknown>)['CONFIG'] = {
          Canvas: { polygonBackends: { move: doorCollision } }
        };
        (global as Record<string, unknown>)['canvas'] = {
          scene: { grid: { size: 100 } }
        };

        const mockWall = {
          _id: 'door-wall-1',
          c: [200, -10000, 200, 10000],
          door: 1,
          ds: 0 as number | undefined,
          move: 20,
          sense: 20,
          update: jest.fn().mockImplementation(function (this: { ds: number | undefined }, data: { ds: number }) {
            this.ds = data.ds;
            return Promise.resolve(this);
          })
        };

        const mockToken = createMockToken({ x: 100, y: 0, ...tokenOverrides });
        mockToken.update.mockImplementation((data) => {
          Object.assign(mockToken, data);
          return Promise.resolve(mockToken);
        });

        const mockScene = createMockScene();
        mockScene.tokens.get.mockImplementation(() => mockToken);
        (mockScene as unknown as Record<string, unknown>)['walls'] = {
          get: jest.fn().mockReturnValue(mockWall),
          contents: [mockWall]
        };
        mockGame.scenes.active = mockScene;

        return { mockToken, mockWall };
      }

      it('opens closed door on path when canOpenDoors=true', async () => {
        // Door at x=200 blocks direct path from (100,0) to (300,0)
        const collision = {
          testCollision: jest.fn((origin: { x: number }, dest: { x: number }) => {
            if ((origin.x < 200 && dest.x >= 200) || (origin.x >= 200 && dest.x < 200)) return true;
            return false;
          })
        };

        const { mockWall } = setupDoorScene(collision);

        const result = await moveTokenHandler({
          tokenId: 'token-123',
          x: 300,
          y: 0,
          canOpenDoors: true
        });

        expect(mockWall.update).toHaveBeenCalledWith({ ds: 1 });
        expect(result.x).toBe(300);
        expect(result.doorsOpened).toContain('door-wall-1');
      });

      it('does not open doors when canOpenDoors is false', async () => {
        const collision = {
          testCollision: jest.fn().mockReturnValue(true)
        };

        const { mockWall } = setupDoorScene(collision);

        await expect(moveTokenHandler({
          tokenId: 'token-123',
          x: 300,
          y: 0,
          canOpenDoors: false
        })).rejects.toThrow('Path blocked');

        expect(mockWall.update).not.toHaveBeenCalled();
      });

      it('does not open locked doors with canOpenDoors=true', async () => {
        // Infinite barrier at x=200 — blocks everything crossing it
        const collision = {
          testCollision: jest.fn((origin: { x: number }, dest: { x: number }) => {
            if ((origin.x < 200 && dest.x >= 200) || (origin.x >= 200 && dest.x < 200)) return true;
            return false;
          })
        };

        const { mockWall } = setupDoorScene(collision);
        mockWall.ds = 2; // locked

        // Locked door means impassable — pathfinder exhausts nodes
        await expect(moveTokenHandler({
          tokenId: 'token-123',
          x: 300,
          y: 0,
          canOpenDoors: true
        })).rejects.toThrow('Path blocked');

        expect(mockWall.update).not.toHaveBeenCalled();
      });

      it('does not include doorsOpened when path has no doors', async () => {
        const collision = {
          testCollision: jest.fn().mockReturnValue(false)
        };

        (global as Record<string, unknown>)['CONFIG'] = {
          Canvas: { polygonBackends: { move: collision } }
        };
        (global as Record<string, unknown>)['canvas'] = {
          scene: { grid: { size: 100 } }
        };

        const mockToken = createMockToken({ x: 100, y: 0 });
        const mockScene = createMockScene();
        mockScene.tokens.get.mockReturnValue(mockToken);
        // Scene has walls but no doors
        (mockScene as unknown as Record<string, unknown>)['walls'] = {
          get: jest.fn().mockReturnValue(undefined),
          contents: [{ _id: 'w1', c: [500, 0, 500, 100], door: 0, ds: 0, move: 20, sense: 20, update: jest.fn() }]
        };
        mockGame.scenes.active = mockScene;

        const result = await moveTokenHandler({
          tokenId: 'token-123',
          x: 300,
          y: 0,
          canOpenDoors: true
        });

        expect(result.doorsOpened).toBeUndefined();
      });

      it('animates every step when canOpenDoors=true', async () => {
        const collision = {
          testCollision: jest.fn((origin: { x: number }, dest: { x: number }) => {
            if ((origin.x < 200 && dest.x >= 200) || (origin.x >= 200 && dest.x < 200)) return true;
            return false;
          })
        };

        const { mockToken } = setupDoorScene(collision);

        await moveTokenHandler({
          tokenId: 'token-123',
          x: 300,
          y: 0,
          canOpenDoors: true
        });

        const calls = mockToken.update.mock.calls;
        // All steps should be animated (canOpenDoors uses full animation)
        for (const call of calls) {
          expect(call[1]).toEqual({ animate: true });
        }
      });
    });
  });

  describe('updateTokenHandler', () => {
    it('updates token properties', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      const result = await updateTokenHandler({
        tokenId: 'token-123',
        hidden: true,
        elevation: 15
      });

      expect(mockToken.update).toHaveBeenCalledWith({
        hidden: true,
        elevation: 15
      });
      expect(result.id).toBe('token-123');
    });

    it('updates all token properties', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      await updateTokenHandler({
        tokenId: 'token-123',
        hidden: true,
        elevation: 15,
        rotation: 180,
        scale: 2,
        name: 'New Name',
        displayName: 50,
        disposition: -1,
        lockRotation: true
      });

      expect(mockToken.update).toHaveBeenCalledWith({
        hidden: true,
        elevation: 15,
        rotation: 180,
        scale: 2,
        name: 'New Name',
        displayName: 50,
        disposition: -1,
        lockRotation: true
      });
    });

    it('returns current token when no updates provided', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(mockToken);
      mockGame.scenes.active = mockScene;

      const result = await updateTokenHandler({
        tokenId: 'token-123'
      });

      expect(mockToken.update).not.toHaveBeenCalled();
      expect(result.id).toBe('token-123');
    });

    it('throws error when token not found', async () => {
      const mockScene = createMockScene();
      mockScene.tokens.get.mockReturnValue(undefined);
      mockGame.scenes.active = mockScene;

      await expect(updateTokenHandler({
        tokenId: 'nonexistent',
        hidden: true
      })).rejects.toThrow('Token not found: nonexistent');
    });
  });

  describe('getSceneTokensHandler', () => {
    it('returns tokens from active scene', async () => {
      const mockToken1 = createMockToken({ id: 'token-1', name: 'Token 1' });
      const mockToken2 = createMockToken({ id: 'token-2', name: 'Token 2', actor: null });
      const mockScene = createMockScene({
        tokens: {
          get: jest.fn(),
          contents: [mockToken1, mockToken2]
        }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneTokensHandler({});

      expect(result).toEqual({
        sceneId: 'scene-123',
        sceneName: 'Test Scene',
        tokens: [
          {
            id: 'token-1',
            name: 'Token 1',
            actorId: 'actor-456',
            x: 100,
            y: 200,
            width: 1,
            height: 1,
            elevation: 0,
            rotation: 0,
            hidden: false,
            img: 'icons/token.png',
            disposition: 1,
            hp: { value: 25, max: 30 },
            ac: 15,
            conditions: []
          },
          {
            id: 'token-2',
            name: 'Token 2',
            actorId: null,
            x: 100,
            y: 200,
            width: 1,
            height: 1,
            elevation: 0,
            rotation: 0,
            hidden: false,
            img: 'icons/token.png',
            disposition: 1,
            conditions: []
          }
        ]
      });
    });

    it('returns tokens from specific scene', async () => {
      const mockToken = createMockToken();
      const mockScene = createMockScene({
        id: 'specific-scene',
        name: 'Specific Scene',
        tokens: {
          get: jest.fn(),
          contents: [mockToken]
        }
      });
      mockGame.scenes.get.mockReturnValue(mockScene);

      const result = await getSceneTokensHandler({
        sceneId: 'specific-scene'
      });

      expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
      expect(result.sceneId).toBe('specific-scene');
      expect(result.sceneName).toBe('Specific Scene');
    });

    it('returns empty tokens array for empty scene', async () => {
      const mockScene = createMockScene({
        tokens: {
          get: jest.fn(),
          contents: []
        }
      });
      mockGame.scenes.active = mockScene;

      const result = await getSceneTokensHandler({});

      expect(result.tokens).toEqual([]);
    });

    it('throws error when no active scene', async () => {
      mockGame.scenes.active = null;

      await expect(getSceneTokensHandler({})).rejects.toThrow('No active scene');
    });

    it('throws error when scene not found', async () => {
      mockGame.scenes.get.mockReturnValue(undefined);

      await expect(getSceneTokensHandler({
        sceneId: 'nonexistent'
      })).rejects.toThrow('Scene not found: nonexistent');
    });
  });
});