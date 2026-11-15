import { FoundrySceneLocator } from '../FoundrySceneLocator';
import type { FoundrySceneLike, FoundryScenesGame } from '../foundryScenes';
import { globalGameProvider } from '../gameProvider';

function gameWith(active: FoundrySceneLike | null, others: FoundrySceneLike[] = []): {
  game: FoundryScenesGame;
  get: jest.Mock;
} {
  const get = jest.fn((id: string) => others.find((scene) => scene.id === id));
  return { game: { scenes: { get, active } }, get };
}

describe('FoundrySceneLocator', () => {
  it('finds a scene by id', () => {
    const { game, get } = gameWith({ id: 'active', name: 'Active' }, [{ id: 'other', name: 'Other' }]);
    const locator = new FoundrySceneLocator({ getGame: () => game });

    expect(locator.findScene('other')).toEqual({ id: 'other', name: 'Other' });
    expect(get).toHaveBeenCalledWith('other');
  });

  it('returns null for an unknown scene id', () => {
    const { game } = gameWith(null);

    expect(new FoundrySceneLocator({ getGame: () => game }).findScene('missing')).toBeNull();
  });

  it('answers for the active scene without a collection lookup', () => {
    const { game, get } = gameWith({ id: 'active', name: 'Active' });
    const locator = new FoundrySceneLocator({ getGame: () => game });

    expect(locator.findScene('active')).toEqual({ id: 'active', name: 'Active' });
    expect(locator.findActiveScene()).toEqual({ id: 'active', name: 'Active' });
    expect(get).not.toHaveBeenCalled();
  });

  it('gives a scene without a name an empty one', () => {
    const { game } = gameWith({ id: 'active' });

    expect(new FoundrySceneLocator({ getGame: () => game }).findActiveScene()).toEqual({ id: 'active', name: '' });
  });

  it.each([null, undefined])('returns null when the core reports %s for the active scene', (active) => {
    const game: FoundryScenesGame = { scenes: { get: () => undefined, active } };

    expect(new FoundrySceneLocator({ getGame: () => game }).findActiveScene()).toBeNull();
    expect(new FoundrySceneLocator({ getGame: () => game }).findScene('any')).toBeNull();
  });
});

describe('globalGameProvider', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('reads the game global at call time, not at creation', () => {
    const provider = globalGameProvider<{ marker: string }>();
    (globalThis as Record<string, unknown>)['game'] = { marker: 'late' };

    expect(provider.getGame().marker).toBe('late');
  });
});
