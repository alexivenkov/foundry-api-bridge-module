import { CommandRouter } from '@/commands/CommandRouter';
import type { Command, RollResult } from '@/commands/types';

describe('CommandRouter', () => {
  let router: CommandRouter;

  beforeEach(() => {
    router = new CommandRouter();
  });

  describe('register', () => {
    it('should register handler for command type', () => {
      const handler = jest.fn();
      router.register('roll-dice', handler);

      expect(router.hasHandler('roll-dice')).toBe(true);
    });
  });

  describe('hasHandler', () => {
    it('should return false for unregistered command', () => {
      expect(router.hasHandler('roll-dice')).toBe(false);
    });

    it('should return true for registered command', () => {
      router.register('roll-dice', jest.fn());
      expect(router.hasHandler('roll-dice')).toBe(true);
    });
  });

  describe('execute', () => {
    it('should execute registered handler', async () => {
      const mockResult: RollResult = {
        total: 15,
        formula: '2d6+3',
        dice: [{ type: 'd6', count: 2, results: [5, 7] }]
      };

      router.register('roll-dice', jest.fn().mockResolvedValue(mockResult));

      const command: Command = {
        id: 'test-123',
        type: 'roll-dice',
        params: { formula: '2d6+3' }
      };

      const response = await router.execute(command);

      expect(response).toEqual({
        id: 'test-123',
        success: true,
        data: mockResult
      });
    });

    it('should return error for unknown command type', async () => {
      const command: Command = {
        id: 'test-456',
        type: 'roll-dice',
        params: { formula: '1d20' }
      };

      const response = await router.execute(command);

      expect(response).toEqual({
        id: 'test-456',
        success: false,
        error: 'Unknown command type: roll-dice'
      });
    });

    it('should handle handler errors', async () => {
      router.register('roll-dice', jest.fn().mockRejectedValue(new Error('Invalid formula')));

      const command: Command = {
        id: 'test-789',
        type: 'roll-dice',
        params: { formula: 'invalid' }
      };

      const response = await router.execute(command);

      expect(response).toEqual({
        id: 'test-789',
        success: false,
        error: 'Invalid formula'
      });
    });

    it('should handle non-Error throws', async () => {
      router.register('roll-dice', jest.fn().mockRejectedValue('string error'));

      const command: Command = {
        id: 'test-000',
        type: 'roll-dice',
        params: { formula: '1d20' }
      };

      const response = await router.execute(command);

      expect(response).toEqual({
        id: 'test-000',
        success: false,
        error: 'string error'
      });
    });

    it('should pass params to handler', async () => {
      const handler = jest.fn().mockResolvedValue({ total: 10, formula: '1d20', dice: [] });
      router.register('roll-dice', handler);

      const params = { formula: '1d20', showInChat: true, flavor: 'Attack roll' };
      const command: Command = {
        id: 'test-params',
        type: 'roll-dice',
        params
      };

      await router.execute(command);

      expect(handler).toHaveBeenCalledWith(params);
    });
  });
});