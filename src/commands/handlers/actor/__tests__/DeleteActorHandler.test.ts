import { deleteActorHandler } from '../DeleteActorHandler';

const mockActor = {
  id: 'actor-123',
  delete: jest.fn()
};

const mockGame = {
  actors: {
    get: jest.fn()
  }
};

(global as Record<string, unknown>)['game'] = mockGame;

describe('deleteActorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.actors.get.mockReturnValue(mockActor);
    mockActor.delete.mockResolvedValue(mockActor);
  });

  describe('successful deletion', () => {
    it('should delete an actor and return success', async () => {
      const result = await deleteActorHandler({
        actorId: 'actor-123'
      });

      expect(mockGame.actors.get).toHaveBeenCalledWith('actor-123');
      expect(mockActor.delete).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: true
      });
    });
  });

  describe('error handling', () => {
    it('should throw error if actor not found', async () => {
      mockGame.actors.get.mockReturnValue(undefined);

      await expect(
        deleteActorHandler({ actorId: 'non-existent' })
      ).rejects.toThrow('Actor not found: non-existent');
    });
  });
});