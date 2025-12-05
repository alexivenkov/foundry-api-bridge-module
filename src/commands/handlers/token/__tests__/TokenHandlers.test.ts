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
  elevation: number;
  rotation: number;
  hidden: boolean;
  texture: {
    src: string;
  };
  disposition: number;
  actor: {
    id: string;
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
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: {
      src: 'icons/token.png'
    },
    disposition: 1,
    actor: {
      id: 'actor-456'
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
        elevation: 0,
        rotation: 0,
        hidden: false,
        img: 'icons/token.png',
        disposition: 1
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
            elevation: 0,
            rotation: 0,
            hidden: false,
            img: 'icons/token.png',
            disposition: 1
          },
          {
            id: 'token-2',
            name: 'Token 2',
            actorId: null,
            x: 100,
            y: 200,
            elevation: 0,
            rotation: 0,
            hidden: false,
            img: 'icons/token.png',
            disposition: 1
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