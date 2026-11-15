import { CoreFeatureUnavailableError, SceneNotFoundError } from '../../../shared';
import { SceneCreationCancelledError } from '../../domain';
import { SceneQueryService } from '../SceneQueryService';
import { SceneSettingsService } from '../SceneSettingsService';
import { FakeCollisions, FakeSceneLocator, FakeSceneReader, FakeViewport, contents } from './fakePorts';
import {
  FOUNDRY_11,
  FOUNDRY_13,
  FakeConfiguredStore,
  FakeLevelStore,
  FakeLinks,
  FakeSettingsReader,
  FakeWeather,
  sceneLevel,
  settings
} from './settingsFakes';

const WEATHER = [
  { id: 'rain', label: 'Rain' },
  { id: 'snow', label: 'Snow' }
];

function setup(
  options: {
    current?: ReturnType<typeof settings>;
    reader?: FakeSettingsReader;
    levels?: FakeLevelStore;
    weather?: FakeWeather;
  } = {}
): {
  service: SceneSettingsService;
  store: FakeConfiguredStore;
  links: FakeLinks;
  reader: FakeSettingsReader;
  weather: FakeWeather;
} {
  const store = new FakeConfiguredStore();
  const reader = options.reader ?? new FakeSettingsReader({ dungeon: options.current ?? settings(), tavern: settings() });
  const links = new FakeLinks(
    [
      { id: 'battle', childIds: ['drums'] },
      { id: 'calm', childIds: ['lute'] }
    ],
    [{ id: 'lore', childIds: ['page-1'] }]
  );
  const weather = options.weather ?? new FakeWeather(WEATHER);
  const scenes = new FakeSceneLocator(['dungeon', 'tavern'], 'tavern');
  const query = new SceneQueryService({
    scenes,
    reader: new FakeSceneReader([contents({ id: 'dungeon' }), contents({ id: 'tavern' })]),
    collisions: new FakeCollisions(undefined),
    viewport: new FakeViewport(null)
  });
  const service = new SceneSettingsService({
    scenes,
    store,
    query,
    settings: reader,
    links,
    weather,
    levels: options.levels ?? new FakeLevelStore({ dungeon: [sceneLevel('ground', { elevation: { bottom: 10, top: 20 } })] })
  });
  return { service, store, links, reader, weather };
}

describe('SceneSettingsService', () => {
  describe('createScene', () => {
    it('creates the scene and answers with the settings the core stored', async () => {
      const { service, store } = setup();

      const created = await service.createScene({ draft: { name: 'Crypt', weather: 'snow', tokenVision: false } });

      expect(store.created).toHaveLength(1);
      expect(store.created[0]).toMatchObject({ name: 'Crypt', weather: 'snow', tokenVision: false });
      expect(created).toEqual({ scene: expect.objectContaining({ id: 'created' }), settings: store.answer });
    });

    it('leaves a scene alone that came out with the images of its draft', async () => {
      const { service, store } = setup();

      const created = await service.createScene({ draft: { name: 'Crypt', backgroundSrc: 'maps/crypt.webp' } });

      expect(store.updated).toEqual([]);
      expect(created.scene.backgroundSrc).toBe('maps/crypt.webp');
    });

    it('sets the images the core left out, and answers with the scene as it is afterwards', async () => {
      const { service, store } = setup();
      store.leavesOut = { backgroundSrc: 'maps/crypt.webp', foregroundSrc: 'fx/fog.webp' };
      const draft = { name: 'Crypt', width: 2000, backgroundSrc: 'maps/crypt.webp', foregroundSrc: 'fx/fog.webp' };

      const created = await service.createScene({ draft });

      expect(store.created).toHaveLength(1);
      expect(store.created[0]).toMatchObject(draft);
      expect(store.updated).toEqual([
        { sceneId: 'created', changes: { backgroundSrc: 'maps/crypt.webp', foregroundSrc: 'fx/fog.webp' }, options: undefined }
      ]);
      expect(created).toEqual({
        scene: expect.objectContaining({ id: 'created', backgroundSrc: 'maps/crypt.webp' }),
        settings: store.answer
      });
    });

    it('sets only the first-level fields that are missing', async () => {
      const { service, store } = setup();
      store.leavesOut = { fogOverlaySrc: 'fx/fog.webp', foregroundElevation: 30 };

      await service.createScene({
        draft: { name: 'Crypt', backgroundSrc: 'maps/crypt.webp', fogOverlaySrc: 'fx/fog.webp', foregroundElevation: 30 }
      });

      expect(store.updated).toEqual([
        { sceneId: 'created', changes: { fogOverlaySrc: 'fx/fog.webp', foregroundElevation: 30 }, options: undefined }
      ]);
    });

    it('fails when the core created nothing, and writes nothing after', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(service.createScene({ draft: { name: 'Vetoed' } })).rejects.toThrow(SceneCreationCancelledError);
      expect(store.updated).toEqual([]);
    });

    it('refuses an unknown weather effect before writing anything', async () => {
      const { service, store } = setup();

      await expect(service.createScene({ draft: { name: 'Crypt', weather: 'hail' } })).rejects.toThrow(
        'Weather effect not found: hail'
      );
      expect(store.created).toEqual([]);
    });

    it('checks a playlist sound against the playlist of the draft', async () => {
      const { service } = setup();

      await expect(
        service.createScene({ draft: { name: 'Crypt', playlistId: 'battle', playlistSoundId: 'lute' } })
      ).rejects.toThrow('Playlist sound not found: lute');
      await expect(service.createScene({ draft: { name: 'Crypt', playlistSoundId: 'drums' } })).rejects.toThrow(
        'A playlist sound needs a playlist: set playlistId as well'
      );
    });

    it('refuses a global light range that is inverted against the defaults', async () => {
      const { service } = setup();

      await expect(
        service.createScene({ draft: { name: 'Crypt', globalLight: { darkness: { min: 0.5, max: 0.4 } } } })
      ).rejects.toThrow('Global light darkness min (0.5) may not exceed max (0.4)');
    });

    it('refuses settings the running core does not store', async () => {
      const reader = new FakeSettingsReader({}, FOUNDRY_11);
      const { service } = setup({ reader });

      await expect(service.createScene({ draft: { name: 'Crypt', darknessLock: true } })).rejects.toThrow(
        CoreFeatureUnavailableError
      );
    });
  });

  describe('updateScene', () => {
    it('sends the changes and the darkness animation to the scene addressed', async () => {
      const { service, store } = setup();

      const updated = await service.updateScene({
        sceneId: 'dungeon',
        changes: { darkness: 0.8, weather: null },
        options: { darknessAnimationMs: 5000 }
      });

      expect(store.updated).toEqual([
        {
          sceneId: 'dungeon',
          changes: expect.objectContaining({ darkness: 0.8, weather: null }),
          options: { darknessAnimationMs: 5000 }
        }
      ]);
      expect(updated.settings).toBe(store.answer);
    });

    it('applies the changes to an existing scene and answers with it afterwards', async () => {
      const { service, store } = setup();

      const updated = await service.updateScene({ sceneId: 'dungeon', changes: { name: 'Deep Dungeon' } });

      expect(store.updated).toEqual([
        { sceneId: 'dungeon', changes: expect.objectContaining({ name: 'Deep Dungeon' }), options: undefined }
      ]);
      expect(updated.scene.name).toBe('Deep Dungeon');
    });

    it('rejects a missing scene before anything else', async () => {
      const { service, store } = setup();

      await expect(service.updateScene({ sceneId: 'missing', changes: { weather: 'rain' } })).rejects.toThrow(
        SceneNotFoundError
      );
      expect(store.updated).toEqual([]);
    });

    it('never falls back to the active scene', async () => {
      const { service, store } = setup();

      await expect(service.updateScene({ sceneId: '', changes: {} })).rejects.toThrow(SceneNotFoundError);
      expect(store.updated).toEqual([]);
    });

    it('looks up neither links nor weather for changes that do not touch them', async () => {
      const { service, links, weather } = setup();

      await service.updateScene({ sceneId: 'dungeon', changes: { tokenVision: false } });

      expect(links.asked).toEqual([]);
      expect(weather.asked).toBe(0);
    });

    it('refuses a playlist that does not exist and a journal page of no linked entry', async () => {
      const { service } = setup();

      await expect(service.updateScene({ sceneId: 'dungeon', changes: { playlistId: 'gone' } })).rejects.toThrow(
        'Playlist not found: gone'
      );
      await expect(service.updateScene({ sceneId: 'dungeon', changes: { journalId: 'gone' } })).rejects.toThrow(
        'Journal entry not found: gone'
      );
      await expect(service.updateScene({ sceneId: 'dungeon', changes: { journalPageId: 'page-1' } })).rejects.toThrow(
        'A journal page needs a journal entry: set journalId as well'
      );
    });

    it('checks a sound alone against the playlist the scene already links', async () => {
      const current = settings({
        links: { playlistId: 'battle', playlistSoundId: null, journalId: 'lore', journalPageId: null }
      });
      const { service, store } = setup({ current });

      await service.updateScene({ sceneId: 'dungeon', changes: { playlistSoundId: 'drums', journalPageId: 'page-1' } });

      expect(store.updated[0]?.changes).toMatchObject({ playlistSoundId: 'drums', journalPageId: 'page-1' });
      await expect(service.updateScene({ sceneId: 'dungeon', changes: { playlistSoundId: 'lute' } })).rejects.toThrow(
        'Playlist sound not found: lute'
      );
    });

    it('drops the sound of a playlist the scene no longer links', async () => {
      const current = settings({
        links: { playlistId: 'battle', playlistSoundId: 'drums', journalId: null, journalPageId: null }
      });
      const { service, store } = setup({ current });

      await service.updateScene({ sceneId: 'dungeon', changes: { playlistId: 'calm' } });

      expect(store.updated[0]?.changes).toMatchObject({ playlistId: 'calm', playlistSoundId: null });
    });

    it('checks the global light range against the current one', async () => {
      const current = settings();
      const lit = settings({
        environment: { ...current.environment, globalLight: { ...current.environment.globalLight, darkness: { min: 0.3, max: 0.6 } } }
      });
      const { service } = setup({ current: lit });

      await expect(
        service.updateScene({ sceneId: 'dungeon', changes: { globalLight: { darkness: { max: 0.2 } } } })
      ).rejects.toThrow('Global light darkness min (0.3) may not exceed max (0.2)');
    });

    it('checks an initial level against the levels of the scene', async () => {
      const { service, store } = setup();

      await service.updateScene({ sceneId: 'dungeon', changes: { initialLevelId: 'ground' } });
      expect(store.updated[0]?.changes.initialLevelId).toBe('ground');

      await expect(service.updateScene({ sceneId: 'dungeon', changes: { initialLevelId: 'attic' } })).rejects.toThrow(
        'Level not found: attic'
      );
    });

    it('keeps the foreground elevation inside the first level on Foundry 14', async () => {
      const { service } = setup();

      await expect(service.updateScene({ sceneId: 'dungeon', changes: { foregroundElevation: 5 } })).rejects.toThrow(
        'Level elevation top (5) may not be below its bottom (10)'
      );
      await expect(service.updateScene({ sceneId: 'dungeon', changes: { foregroundElevation: 15 } })).resolves.toBeDefined();
    });

    it('does not read the levels on a core without them', async () => {
      const levels = new FakeLevelStore();
      const readLevels = jest.spyOn(levels, 'readLevels');
      const reader = new FakeSettingsReader({ dungeon: settings() }, FOUNDRY_13);
      const { service } = setup({ reader, levels });

      await service.updateScene({ sceneId: 'dungeon', changes: { foregroundElevation: 5 } });

      expect(readLevels).not.toHaveBeenCalled();
    });

    it('refuses an initial level below Foundry 14', async () => {
      const reader = new FakeSettingsReader({ dungeon: settings() }, FOUNDRY_13);
      const { service } = setup({ reader });

      await expect(service.updateScene({ sceneId: 'dungeon', changes: { initialLevelId: 'ground' } })).rejects.toThrow(
        'Scene levels require Foundry 14 or newer'
      );
    });

    it('still sends an update that changes nothing', async () => {
      const { service, store } = setup();

      await service.updateScene({ sceneId: 'tavern', changes: {} });

      expect(store.updated).toHaveLength(1);
      expect(store.updated[0]?.sceneId).toBe('tavern');
    });
  });

  describe('describeScene', () => {
    it('adds the settings of the scene described', () => {
      const current = settings({ weather: 'snow' });
      const { service, reader } = setup({ current });

      const details = service.describeScene({ sceneId: 'dungeon', includeScreenshot: false });

      expect(details.scene.id).toBe('dungeon');
      expect(details.settings).toBe(current);
      expect(reader.read).toEqual(['dungeon']);
    });

    it('describes the active scene when none is named', () => {
      const { service, reader } = setup();

      expect(service.describeScene({ sceneId: undefined, includeScreenshot: false }).scene.id).toBe('tavern');
      expect(reader.read).toEqual(['tavern']);
    });
  });

  it('lists the weather effects, or none when the registry cannot be read', () => {
    expect(setup().service.listWeatherEffects()).toEqual(WEATHER);
    expect(setup({ weather: new FakeWeather(null) }).service.listWeatherEffects()).toEqual([]);
  });
});
