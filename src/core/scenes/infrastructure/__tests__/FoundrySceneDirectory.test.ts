import { FoundrySceneDirectory } from '../FoundrySceneDirectory';
import type { FoundrySceneGame } from '../foundrySceneTypes';
import type { FoundrySceneCanvasGlobals } from '../sceneCanvas';
import { gameWith } from './fakeDocuments';

function directory(extra: Partial<FoundrySceneGame>, config?: FoundrySceneCanvasGlobals['CONFIG']): FoundrySceneDirectory {
  const game: FoundrySceneGame = { ...gameWith(), ...extra };
  return new FoundrySceneDirectory({ getGame: () => game }, () => (config === undefined ? {} : { CONFIG: config }));
}

describe('FoundrySceneDirectory', () => {
  describe('links', () => {
    const playlists = {
      get: (id: string) =>
        id === 'battle' ? { id: 'battle', sounds: { contents: [{ id: 'drums' }, { id: 'horns' }] } } : undefined
    };
    const journal = {
      get: (id: string) => (id === 'lore' ? { id: 'lore', pages: { contents: [{ id: 'p1' }] } } : undefined)
    };

    it('finds a playlist with its sounds and an entry with its pages', () => {
      const links = directory({ playlists, journal });

      expect(links.findPlaylist('battle')).toEqual({ id: 'battle', childIds: ['drums', 'horns'] });
      expect(links.findJournalEntry('lore')).toEqual({ id: 'lore', childIds: ['p1'] });
    });

    it('finds nothing that is not there, nor in a world without those collections', () => {
      expect(directory({ playlists, journal }).findPlaylist('gone')).toBeNull();
      expect(directory({}).findPlaylist('battle')).toBeNull();
      expect(directory({}).findJournalEntry('lore')).toBeNull();
    });
  });

  describe('users', () => {
    it('lists the users with whether they are connected, and the one this module runs as', () => {
      const users = directory({
        users: { contents: [{ id: 'gm', active: true }, { id: 'alice', active: false }, { id: 'bob' }] },
        user: { id: 'gm' }
      });

      expect(users.listUsers()).toEqual([
        { id: 'gm', active: true },
        { id: 'alice', active: false },
        { id: 'bob', active: false }
      ]);
      expect(users.currentUserId()).toBe('gm');
    });

    it('lists nobody before the users exist', () => {
      expect(directory({}).listUsers()).toEqual([]);
      expect(directory({}).currentUserId()).toBeNull();
    });
  });

  describe('weather effects', () => {
    const weatherEffects = {
      rain: { id: 'rain', label: 'WEATHER.Rain' },
      myStorm: { label: 'Module Storm' }
    };

    it('lists the registry by key, with localized labels', () => {
      const localize = jest.fn((key: string) => (key === 'WEATHER.Rain' ? 'Rain' : key));
      const catalog = directory({ i18n: { localize } }, { weatherEffects });

      expect(catalog.listWeatherEffects()).toEqual([
        { id: 'rain', label: 'Rain' },
        { id: 'myStorm', label: 'Module Storm' }
      ]);
    });

    it('keeps the raw labels without localization, and reports an unreadable registry', () => {
      expect(directory({}, { weatherEffects }).listWeatherEffects()?.[0]).toEqual({ id: 'rain', label: 'WEATHER.Rain' });
      expect(directory({}, {}).listWeatherEffects()).toBeNull();
      expect(directory({}).listWeatherEffects()).toBeNull();
    });
  });
});
