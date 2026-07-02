import { foundryGeneration, isV14Plus } from '../foundryVersion';

function setGame(game: unknown): void {
  (globalThis as Record<string, unknown>)['game'] = game;
}

describe('foundryVersion', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  describe('foundryGeneration', () => {
    it('reads game.release.generation when present', () => {
      setGame({ release: { generation: 14 }, version: '13.999' });
      expect(foundryGeneration()).toBe(14);
    });

    it('falls back to the major segment of game.version', () => {
      setGame({ version: '13.341' });
      expect(foundryGeneration()).toBe(13);
    });

    it('returns 0 when no version information is available', () => {
      setGame({});
      expect(foundryGeneration()).toBe(0);
    });

    it('returns 0 when game is undefined', () => {
      delete (globalThis as Record<string, unknown>)['game'];
      expect(foundryGeneration()).toBe(0);
    });
  });

  describe('isV14Plus', () => {
    it('is true for generation 14', () => {
      setGame({ release: { generation: 14 } });
      expect(isV14Plus()).toBe(true);
    });

    it('is true for a future generation', () => {
      setGame({ release: { generation: 15 } });
      expect(isV14Plus()).toBe(true);
    });

    it('is false for generation 13', () => {
      setGame({ release: { generation: 13 } });
      expect(isV14Plus()).toBe(false);
    });

    it('is false when version is unknown', () => {
      setGame({});
      expect(isV14Plus()).toBe(false);
    });
  });
});
