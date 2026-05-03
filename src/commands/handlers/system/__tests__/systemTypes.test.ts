import { getGame, getUi, getCanvas } from '../systemTypes';

describe('systemTypes helpers', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
    delete (globalThis as Record<string, unknown>)['ui'];
    delete (globalThis as Record<string, unknown>)['canvas'];
  });

  describe('getGame', () => {
    it('throws when game global is missing', () => {
      expect(() => getGame()).toThrow('Game not available');
    });

    it('returns game when present', () => {
      const game = { time: { worldTime: 0, advance: jest.fn(), set: jest.fn() }, paused: false, togglePause: jest.fn() };
      (globalThis as Record<string, unknown>)['game'] = game;
      expect(getGame()).toBe(game);
    });
  });

  describe('getUi', () => {
    it('throws when ui global is missing', () => {
      expect(() => getUi()).toThrow('UI notifications not available');
    });

    it('throws when ui.notifications is missing', () => {
      (globalThis as Record<string, unknown>)['ui'] = {};
      expect(() => getUi()).toThrow('UI notifications not available');
    });

    it('returns ui when notifications are present', () => {
      const notifications = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
      (globalThis as Record<string, unknown>)['ui'] = { notifications };
      expect(getUi()).toEqual({ notifications });
    });
  });

  describe('getCanvas', () => {
    it('throws when canvas global is missing', () => {
      expect(() => getCanvas()).toThrow('Canvas not available');
    });

    it('throws when canvas is null', () => {
      (globalThis as Record<string, unknown>)['canvas'] = null;
      expect(() => getCanvas()).toThrow('Canvas not available');
    });

    it('returns canvas when present', () => {
      const canvas = { animatePan: jest.fn(), ping: jest.fn() };
      (globalThis as Record<string, unknown>)['canvas'] = canvas;
      expect(getCanvas()).toBe(canvas);
    });
  });
});
