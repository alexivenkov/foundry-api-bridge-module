import type { FoundryWorldInfoGame } from '../../../../core/world/infrastructure';
import { createGetWorldInfoHandler } from '../GetWorldInfoHandler';

function each<T>(items: T[]): { forEach(fn: (item: T) => void): void } {
  return {
    forEach: (fn) => {
      items.forEach((item) => {
        fn(item);
      });
    }
  };
}

describe('get-world-info session fields', () => {
  it('adds active modules, the active scene, users, pause and world time', async () => {
    const game: FoundryWorldInfoGame = {
      world: { id: 'w', title: 'World' },
      system: { id: 'dnd5e', version: '5.1.0' },
      version: '13.351',
      modules: {
        get: () => ({ version: '8.18.0' }),
        ...each([
          { id: 'foundry-api-bridge', title: 'Foundry API Bridge', version: '8.18.0', active: true },
          { id: 'off', title: 'Disabled', version: '1.0.0', active: false }
        ])
      },
      scenes: { size: 1, active: { id: 's1', name: 'Crypt' } },
      users: each([{ id: 'gm', name: 'GM', isGM: true, active: true }]),
      paused: false,
      time: { worldTime: 120 }
    };

    const result = await createGetWorldInfoHandler({ gameProvider: { getGame: () => game } })({});

    expect(result.modules).toEqual([{ id: 'foundry-api-bridge', title: 'Foundry API Bridge', version: '8.18.0' }]);
    expect(result.activeScene).toEqual({ id: 's1', name: 'Crypt' });
    expect(result.users).toEqual([{ id: 'gm', name: 'GM', isGM: true, active: true }]);
    expect(result.paused).toBe(false);
    expect(result.worldTime).toBe(120);
    expect(result.world.moduleVersion).toBe('8.18.0');
  });

  it('answers empty lists and nulls while the game is loading', async () => {
    const result = await createGetWorldInfoHandler({ gameProvider: { getGame: () => ({}) } })({});

    expect(result).toMatchObject({ modules: [], activeScene: null, users: [], paused: null, worldTime: null });
  });
});
