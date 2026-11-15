import type { FoundrySceneDocument, FoundrySceneGame } from '../../../../core/scenes/infrastructure';
import { clearGeneration, gameWith, sceneDocument, setGeneration } from '../../../../core/scenes/infrastructure/__tests__/fakeDocuments';
import { levelDocument, sceneWithLevels } from '../../../../core/scenes/infrastructure/__tests__/fakeLevelDocuments';
import { createCreateSceneHandler } from '../CreateSceneHandler';
import { createGetSceneHandler } from '../GetSceneHandler';
import { createGetWeatherEffectsHandler } from '../GetWeatherEffectsHandler';
import { createUpdateSceneHandler } from '../UpdateSceneHandler';

const playlists = {
  get: (id: string) => (id === 'pl00000000000001' ? { id, sounds: { contents: [{ id: 'snd0000000000001' }] } } : undefined)
};
const weatherEffects = { rain: { id: 'rain', label: 'WEATHER.Rain' }, snow: { id: 'snow', label: 'WEATHER.Snow' } };

function world(...scenes: FoundrySceneDocument[]): FoundrySceneGame {
  return { ...gameWith(...scenes), playlists, i18n: { localize: (key: string) => key.replace('WEATHER.', '') } };
}

function wiring(game: FoundrySceneGame, create?: jest.Mock): Parameters<typeof createUpdateSceneHandler>[0] {
  return {
    gameProvider: { getGame: () => game },
    canvasGlobals: () => ({ CONFIG: { weatherEffects } }),
    ...(create ? { sceneClass: () => ({ create }) } : {})
  };
}

describe('scene settings handlers', () => {
  beforeEach(() => {
    setGeneration(13);
  });

  afterEach(clearGeneration);

  describe('update-scene', () => {
    it('writes the settings and answers with the summary plus the settings afterwards', async () => {
      const document = sceneDocument();
      (document.update as jest.Mock).mockImplementation((data: Record<string, unknown>) => {
        document._source = { weather: data['weather'] as string, playlist: data['playlist'] as string };
        return Promise.resolve(document);
      });
      const handler = createUpdateSceneHandler(wiring(world(document)));

      const result = await handler({ sceneId: 'dungeon', weather: 'rain', playlistId: 'pl00000000000001', darkness: 0.5, animateDarkness: 2000 });

      expect(document.update).toHaveBeenCalledWith(
        { darkness: 0.5, weather: 'rain', playlist: 'pl00000000000001' },
        { animateDarkness: 2000 }
      );
      expect(result).toMatchObject({ id: 'dungeon', name: 'Dungeon', settings: { weather: 'rain', playlistId: 'pl00000000000001' } });
      expect(result.settings.environment.globalLight.darkness).toEqual({ min: 0, max: 1 });
    });

    it('rejects an invalid setting before reaching the scene', async () => {
      const document = sceneDocument();
      const handler = createUpdateSceneHandler(wiring(world(document)));

      await expect(handler({ sceneId: 'dungeon', backgroundColor: 'red' })).rejects.toThrow('must be a #rrggbb color');
      await expect(handler({ sceneId: 'dungeon', animateDarkness: 1000 })).rejects.toThrow('animateDarkness needs darkness');
      expect(document.update).not.toHaveBeenCalled();
    });

    it('refuses an unknown weather effect and a missing playlist', async () => {
      const handler = createUpdateSceneHandler(wiring(world(sceneDocument())));

      await expect(handler({ sceneId: 'dungeon', weather: 'hail' })).rejects.toThrow('Weather effect not found: hail');
      await expect(handler({ sceneId: 'dungeon', playlistId: 'pl00000000000009' })).rejects.toThrow(
        'Playlist not found: pl00000000000009'
      );
    });

    it('names a missing scene', async () => {
      await expect(createUpdateSceneHandler(wiring(world(sceneDocument())))({ sceneId: 'gone', weather: 'rain' })).rejects.toThrow(
        'Scene not found: gone'
      );
    });

    it('refuses an initial level below Foundry 14', async () => {
      await expect(
        createUpdateSceneHandler(wiring(world(sceneDocument())))({ sceneId: 'dungeon', initialLevelId: 'level00000000002' })
      ).rejects.toThrow('Scene levels require Foundry 14 or newer');
    });

    it('sets the initial level on Foundry 14 and reports it', async () => {
      setGeneration(14);
      const upper = levelDocument('level00000000002');
      const document = sceneWithLevels([levelDocument('defaultLevel0000'), upper]);
      (document.update as jest.Mock).mockImplementation(() => {
        document.initialLevel = upper;
        return Promise.resolve(document);
      });

      const result = await createUpdateSceneHandler(wiring(world(document)))({ sceneId: 'dungeon', initialLevelId: 'level00000000002' });

      expect(document.update).toHaveBeenCalledWith({ initialLevel: 'level00000000002' });
      expect(result.settings.initialLevelId).toBe('level00000000002');
    });
  });

  describe('create-scene', () => {
    it('creates the scene with its settings and answers with them', async () => {
      const created = sceneDocument({ id: 'crypt', _source: { weather: 'snow', tokenVision: false } });
      const create = jest.fn().mockResolvedValue(created);
      const handler = createCreateSceneHandler(wiring(world(), create));

      const result = await handler({ name: 'Crypt', weather: 'snow', tokenVision: false, grid: { size: 70, thickness: 2 } });

      expect(create).toHaveBeenCalledWith({ name: 'Crypt', grid: { size: 70, thickness: 2 }, weather: 'snow', tokenVision: false });
      expect(result).toMatchObject({ id: 'crypt', settings: { weather: 'snow', tokenVision: false } });
    });

    it('rejects an out-of-range setting', async () => {
      const create = jest.fn();

      await expect(
        createCreateSceneHandler(wiring(world(), create))({ name: 'Crypt', globalLight: { alpha: 2 } })
      ).rejects.toThrow('globalLight.alpha');
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('get-scene', () => {
    it('adds the settings of the scene', async () => {
      const document = sceneDocument({
        active: true,
        _source: { weather: 'rain', grid: { style: 'dashedLines' }, initial: { x: 1, y: 2, scale: 0.5 } }
      });

      const result = await createGetSceneHandler(wiring(world(document)))({});

      expect(result.id).toBe('dungeon');
      expect(result.settings).toMatchObject({
        weather: 'rain',
        grid: { style: 'dashedLines' },
        initialView: { x: 1, y: 2, scale: 0.5 }
      });
      expect(result.settings).not.toHaveProperty('initialLevelId');
    });

    it('keeps its short text for a missing active scene', async () => {
      await expect(createGetSceneHandler(wiring(world()))({})).rejects.toThrow('No active scene');
    });
  });

  describe('get-weather-effects', () => {
    it('lists the registered effects with their labels', async () => {
      await expect(createGetWeatherEffectsHandler(wiring(world()))({})).resolves.toEqual({
        weatherEffects: [
          { id: 'rain', label: 'Rain' },
          { id: 'snow', label: 'Snow' }
        ]
      });
    });

    it('lists none when the registry cannot be read', async () => {
      const handler = createGetWeatherEffectsHandler({ gameProvider: { getGame: () => world() }, canvasGlobals: () => ({}) });

      await expect(handler({})).resolves.toEqual({ weatherEffects: [] });
    });
  });
});
