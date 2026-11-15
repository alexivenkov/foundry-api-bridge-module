import type { SceneChanges, SceneDraft } from '../../domain';
import { FoundrySceneSettingsReader } from '../FoundrySceneSettingsReader';
import { FoundrySceneStore } from '../FoundrySceneStore';
import type { FoundrySceneDocument } from '../foundrySceneTypes';
import { clearGeneration, gameWith, level, sceneDocument, setGeneration } from './fakeDocuments';
import { levelDocument, sceneWithLevels, sceneWithSource } from './fakeLevelDocuments';

// Payloads asserted here are the ones the probe pushed through BaseScene of
// 13.351 and 14.368 (scratchpad/scenes/probe-bridge.mjs): they survive
// cleaning and land on the intended fields.

const SETTINGS: SceneChanges = {
  weather: 'snow',
  tokenVision: false,
  fogOverlaySrc: 'fx/fog.webp',
  fogExploredColor: '#112233',
  fogUnexploredColor: '#abcdef',
  darknessLock: true,
  blendAmbience: false,
  globalLight: {
    enabled: true,
    bright: true,
    color: '#ffeedd',
    alpha: 0.3,
    luminosity: 0.2,
    saturation: -0.5,
    contrast: 0.1,
    shadows: 0.4,
    darkness: { min: 0.1, max: 0.7 }
  },
  baseAmbience: { hue: 0.5, intensity: 0.2 },
  darkAmbience: { luminosity: -0.6 },
  initialView: { x: 100, y: 200, scale: 0.75 },
  playlistId: 'pl00000000000001',
  playlistSoundId: 'snd0000000000001',
  journalId: 'je00000000000001',
  journalPageId: 'pg00000000000001',
  grid: { size: 120, style: 'dashedLines', color: '#ff0000', alpha: 0.5, thickness: 3 },
  foregroundElevation: 30,
  backgroundColor: '#123456'
};

const NESTED_ENVIRONMENT = {
  darknessLock: true,
  cycle: false,
  globalLight: {
    enabled: true,
    bright: true,
    color: '#ffeedd',
    alpha: 0.3,
    luminosity: 0.2,
    saturation: -0.5,
    contrast: 0.1,
    shadows: 0.4,
    darkness: { min: 0.1, max: 0.7 }
  },
  base: { hue: 0.5, intensity: 0.2 },
  dark: { luminosity: -0.6 }
};

const LINKS = {
  playlist: 'pl00000000000001',
  playlistSound: 'snd0000000000001',
  journal: 'je00000000000001',
  journalEntryPage: 'pg00000000000001'
};

function storeFor(document: FoundrySceneDocument): FoundrySceneStore {
  const game = gameWith(document);
  return new FoundrySceneStore({ getGame: () => game });
}

function storeCreating(created: FoundrySceneDocument): { store: FoundrySceneStore; create: jest.Mock } {
  const create = jest.fn().mockResolvedValue(created);
  const game = gameWith();
  return { store: new FoundrySceneStore({ getGame: () => game }, () => ({ create })), create };
}

function payloadOf(document: FoundrySceneDocument): Record<string, unknown> {
  return (document.update as jest.Mock).mock.calls[0]?.[0] as Record<string, unknown>;
}

describe('scene settings in the Foundry gateway', () => {
  afterEach(clearGeneration);

  describe('writing them on Foundry 13', () => {
    beforeEach(() => {
      setGeneration(13);
    });

    it('creates the scene with every setting on its nested core path', async () => {
      const { store, create } = storeCreating(sceneDocument());
      const draft: SceneDraft = { ...SETTINGS, name: 'Crypt', darkness: 0.4, fogExploration: false };

      await store.createConfiguredScene(draft);

      expect(create).toHaveBeenCalledWith({
        name: 'Crypt',
        grid: { size: 120, style: 'dashedLines', color: '#ff0000', alpha: 0.5, thickness: 3 },
        fogExploration: false,
        darkness: 0.4,
        weather: 'snow',
        tokenVision: false,
        environment: NESTED_ENVIRONMENT,
        fog: { overlay: 'fx/fog.webp', colors: { explored: '#112233', unexplored: '#abcdef' } },
        initial: { x: 100, y: 200, scale: 0.75 },
        ...LINKS,
        foregroundElevation: 30,
        backgroundColor: '#123456'
      });
    });

    it('stores "no weather" as the empty string, and resets the initial view with nulls', async () => {
      const document = sceneDocument();

      await storeFor(document).updateConfiguredScene('dungeon', {
        weather: null,
        initialView: null,
        fogOverlaySrc: null,
        fogExploredColor: null,
        playlistId: null,
        playlistSoundId: null
      });

      expect(document.update).toHaveBeenCalledWith({
        weather: '',
        fog: { overlay: null, colors: { explored: null } },
        initial: { x: null, y: null, scale: null },
        playlist: null,
        playlistSound: null
      });
    });

    it('keeps a partial initial view partial', async () => {
      const document = sceneDocument();

      await storeFor(document).updateConfiguredScene('dungeon', { initialView: { scale: 2 } });

      expect(document.update).toHaveBeenCalledWith({ initial: { scale: 2 } });
    });

    it('passes the darkness animation as the core update option, and nothing otherwise', async () => {
      const animated = sceneDocument();
      const plain = sceneDocument({ id: 'tavern' });
      const game = gameWith(animated, plain);
      const store = new FoundrySceneStore({ getGame: () => game });

      await store.updateConfiguredScene('dungeon', { darkness: 1 }, { darknessAnimationMs: 8000 });
      await store.updateConfiguredScene('tavern', { darkness: 1 });

      expect(animated.update).toHaveBeenCalledWith({ darkness: 1 }, { animateDarkness: 8000 });
      expect((plain.update as jest.Mock).mock.calls[0]).toEqual([{ darkness: 1 }]);
    });

    it('answers with the scene and the settings it has after the update', async () => {
      const document = sceneWithSource({ weather: '' });
      (document.update as jest.Mock).mockImplementation(() => {
        document._source = { weather: 'rain', tokenVision: false };
        return Promise.resolve(document);
      });

      const configured = await storeFor(document).updateConfiguredScene('dungeon', { weather: 'rain' });

      expect(configured.scene.id).toBe('dungeon');
      expect(configured.settings).toMatchObject({ weather: 'rain', tokenVision: false });
    });
  });

  describe('writing them on Foundry 14', () => {
    beforeEach(() => {
      setGeneration(14);
    });

    it('merges them with darkness and exploration, and sends the first-level fields to that level', async () => {
      const document = sceneWithLevels([levelDocument('defaultLevel0000'), levelDocument('level00000000002')]);

      await storeFor(document).updateConfiguredScene('dungeon', {
        darkness: 0.4,
        fogExploration: false,
        ...SETTINGS,
        initialLevelId: 'level00000000002'
      });

      expect(document.update).toHaveBeenCalledWith({
        grid: { size: 120, style: 'dashedLines', color: '#ff0000', alpha: 0.5, thickness: 3 },
        fog: { mode: 0, colors: { explored: '#112233', unexplored: '#abcdef' } },
        environment: { darknessLevel: 0.4, ...NESTED_ENVIRONMENT },
        weather: 'snow',
        tokenVision: false,
        initial: { x: 100, y: 200, scale: 0.75 },
        ...LINKS,
        initialLevel: 'level00000000002',
        levels: [
          {
            _id: 'defaultLevel0000',
            background: { color: '#123456' },
            fog: { src: 'fx/fog.webp' },
            elevation: { top: 30 }
          }
        ]
      });
    });

    it('puts the background image and color of the first level in one object', async () => {
      const document = sceneWithLevels([levelDocument('defaultLevel0000')]);

      await storeFor(document).updateConfiguredScene('dungeon', {
        backgroundSrc: 'maps/new.webp',
        backgroundColor: '#222222',
        foregroundSrc: 'fx/f.webp'
      });

      expect(payloadOf(document)).toEqual({
        levels: [{ _id: 'defaultLevel0000', background: { src: 'maps/new.webp', color: '#222222' }, foreground: { src: 'fx/f.webp' } }]
      });
    });

    it('reports the first-level fields a creation left out, to be set right after', async () => {
      const created = sceneWithLevels([levelDocument('defaultLevel0000', { fog: { src: null } })]);
      const { store } = storeCreating(created);

      const result = await store.createConfiguredScene({
        name: 'Crypt',
        fogOverlaySrc: 'fx/fog.webp',
        foregroundElevation: 30,
        backgroundColor: '#123456',
        weather: 'rain'
      });

      expect(result?.missingImages).toEqual({ fogOverlaySrc: 'fx/fog.webp', foregroundElevation: 30, backgroundColor: '#123456' });
    });

    it('reports nothing for first-level fields the level already has', async () => {
      const created = sceneWithLevels([
        levelDocument('defaultLevel0000', {
          fog: { src: 'fx/fog.webp' },
          elevation: { bottom: 0, top: 30 },
          background: { src: null, color: '#123456' }
        })
      ]);

      const result = await storeCreating(created).store.createConfiguredScene({
        name: 'Crypt',
        fogOverlaySrc: 'fx/fog.webp',
        foregroundElevation: 30,
        backgroundColor: '#123456'
      });

      expect(result?.missingImages).toBeNull();
    });
  });

  describe('writing them on Foundry 11, which stored environment and fog flat', () => {
    beforeEach(() => {
      setGeneration(11);
    });

    it('uses the flat legacy keys', async () => {
      const document = sceneDocument();

      await storeFor(document).updateConfiguredScene('dungeon', {
        globalLight: { enabled: true, darkness: { max: 0.6 } },
        fogOverlaySrc: 'fx/fog.webp',
        fogExploredColor: '#111111',
        fogUnexploredColor: '#222222',
        weather: 'rain'
      });

      expect(document.update).toHaveBeenCalledWith({
        weather: 'rain',
        globalLight: true,
        globalLightThreshold: 0.6,
        fogOverlay: 'fx/fog.webp',
        fogExploredColor: '#111111',
        fogUnexploredColor: '#222222'
      });
    });
  });

  describe('viewing a level', () => {
    it('passes the level to Scene#view, and nothing without one', async () => {
      const document = sceneDocument();
      const store = storeFor(document);

      await store.viewScene('dungeon', 'tower');
      await store.viewScene('dungeon');

      expect((document.view as jest.Mock).mock.calls).toEqual([[{ level: 'tower' }], []]);
    });
  });

  describe('reading them', () => {
    function read(document: FoundrySceneDocument): ReturnType<FoundrySceneSettingsReader['readSettings']> {
      const game = gameWith(document);
      return new FoundrySceneSettingsReader({ getGame: () => game }).readSettings('dungeon');
    }

    it('reads the stored values of a Foundry 13 scene', () => {
      setGeneration(13);
      const document = sceneWithSource(
        {
          weather: 'rain',
          tokenVision: false,
          foreground: 'fx/f.webp',
          foregroundElevation: null,
          backgroundColor: '#123456',
          initial: { x: 10, y: 20, scale: 1.5 },
          grid: { style: 'dottedLines', color: '#ff0000', alpha: 0.4, thickness: 2 },
          fog: { exploration: false, overlay: 'fx/fog.webp', colors: { explored: '#111111', unexplored: null } },
          environment: {
            darknessLevel: 0.3,
            darknessLock: true,
            cycle: false,
            globalLight: { enabled: true, color: '#ffeedd', darkness: { min: 0.2, max: 0.6 } },
            base: { hue: 0.1 },
            dark: { intensity: 0.5 }
          },
          ...LINKS
        },
        { foregroundElevation: 20 }
      );

      expect(read(document)).toEqual({
        weather: 'rain',
        tokenVision: false,
        environment: {
          darkness: 0.3,
          darknessLock: true,
          blendAmbience: false,
          globalLight: {
            enabled: true,
            bright: false,
            color: '#ffeedd',
            alpha: 0.5,
            luminosity: 0,
            saturation: 0,
            contrast: 0,
            shadows: 0,
            darkness: { min: 0.2, max: 0.6 }
          },
          baseAmbience: { hue: 0.1, intensity: 0, luminosity: 0, saturation: 0, shadows: 0 },
          darkAmbience: { hue: 257 / 360, intensity: 0.5, luminosity: -0.25, saturation: 0, shadows: 0 }
        },
        fog: { exploration: 'disabled', overlaySrc: 'fx/fog.webp', exploredColor: '#111111', unexploredColor: null },
        initialView: { x: 10, y: 20, scale: 1.5 },
        links: {
          playlistId: 'pl00000000000001',
          playlistSoundId: 'snd0000000000001',
          journalId: 'je00000000000001',
          journalPageId: 'pg00000000000001'
        },
        grid: { style: 'dottedLines', color: '#ff0000', alpha: 0.4, thickness: 2 },
        foregroundSrc: 'fx/f.webp',
        foregroundElevation: 20,
        backgroundColor: '#123456'
      });
    });

    it('reads the core defaults for a scene that stores nothing, and no initial level before 14', () => {
      setGeneration(13);
      const settings = read(sceneDocument());

      expect(settings).toMatchObject({
        weather: null,
        tokenVision: true,
        fog: { exploration: 'individual', overlaySrc: null },
        grid: { style: 'solidLines', color: '#000000', alpha: 0.2, thickness: 1 },
        backgroundColor: '#999999',
        foregroundElevation: null
      });
      expect(settings).not.toHaveProperty('initialLevelId');
    });

    it('reads a Foundry 14 scene: fog mode, and the first-level fields from that level', () => {
      setGeneration(14);
      const document = sceneWithLevels(
        [
          levelDocument('defaultLevel0000', {
            foreground: { src: 'fx/f.webp' },
            fog: { src: 'fx/fog.webp' },
            elevation: { bottom: 0, top: null },
            background: { src: 'maps/g.webp', color: '#123456' }
          }),
          levelDocument('level00000000002')
        ],
        { initialLevelId: 'level00000000002', source: { fog: { mode: 2 } } }
      );

      expect(read(document)).toMatchObject({
        fog: { exploration: 'shared', overlaySrc: 'fx/fog.webp' },
        foregroundSrc: 'fx/f.webp',
        foregroundElevation: null,
        backgroundColor: '#123456',
        initialLevelId: 'level00000000002'
      });
    });

    it('reads the foreground of a first level that carries no stored values', () => {
      setGeneration(14);
      const document = sceneDocument({ firstLevel: level({ foreground: { src: 'fx/f.webp' } }) });

      expect(read(document)).toMatchObject({ foregroundSrc: 'fx/f.webp', initialLevelId: null });
    });

    it.each([
      [0, 'disabled'],
      [1, 'individual'],
      [undefined, 'individual']
    ] as const)('reads fog mode %p as %s', (mode, exploration) => {
      setGeneration(14);

      const fog = mode === undefined ? {} : { mode };

      expect(read(sceneWithLevels([levelDocument('l1')], { source: { fog } })).fog.exploration).toBe(exploration);
    });

    it('reads the flat keys of a Foundry 11 scene', () => {
      setGeneration(11);
      const document = sceneWithSource({
        darkness: 0.7,
        globalLight: true,
        globalLightThreshold: null,
        fogExploration: false,
        fogOverlay: 'fx/fog.webp',
        fogExploredColor: '#111111',
        fogUnexploredColor: '#222222'
      });

      expect(read(document)).toMatchObject({
        environment: { darkness: 0.7, globalLight: { enabled: true, darkness: { min: 0, max: 1 } } },
        fog: { exploration: 'disabled', overlaySrc: 'fx/fog.webp', exploredColor: '#111111', unexploredColor: '#222222' }
      });
    });

    it('names a missing scene', () => {
      const game = gameWith(sceneDocument());

      expect(() => new FoundrySceneSettingsReader({ getGame: () => game }).readSettings('gone')).toThrow(
        'Scene not found: gone'
      );
    });

    it.each([
      [11, { environmentDetails: false, gridStyle: false, levels: false }],
      [12, { environmentDetails: true, gridStyle: true, levels: false }],
      [13, { environmentDetails: true, gridStyle: true, levels: false }],
      [14, { environmentDetails: true, gridStyle: true, levels: true }]
    ])('reports what Foundry %i stores', (generation, features) => {
      setGeneration(generation);
      const game = gameWith();

      expect(new FoundrySceneSettingsReader({ getGame: () => game }).features()).toEqual(features);
    });
  });
});
