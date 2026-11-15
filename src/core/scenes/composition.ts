import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import {
  SceneLevelService,
  SceneQueryService,
  SceneService,
  SceneSettingsService,
  SceneTableService
} from './application';
import {
  FoundryMovementCollisions,
  FoundrySceneDirectory,
  FoundrySceneLevelStore,
  FoundrySceneReader,
  FoundrySceneSettingsReader,
  FoundrySceneStore,
  FoundrySceneTable,
  FoundrySceneViewport,
  type FoundrySceneGame,
  type SceneCanvasGlobalsProvider,
  type SceneClassProvider,
  type SceneGameProvider
} from './infrastructure';

export const defaultSceneGameProvider: SceneGameProvider = globalGameProvider<FoundrySceneGame>();

export interface SceneWiring {
  readonly gameProvider?: SceneGameProvider;
  readonly sceneClass?: SceneClassProvider;
  readonly canvasGlobals?: SceneCanvasGlobalsProvider;
}

// Composition root of the context. Handlers pass custom providers only in tests.

export function createFoundrySceneService(wiring: SceneWiring = {}): SceneService {
  const gameProvider = wiring.gameProvider ?? defaultSceneGameProvider;
  const store = new FoundrySceneStore(gameProvider, wiring.sceneClass);
  return new SceneService({ scenes: new FoundrySceneLocator(gameProvider), store, navigator: store });
}

export function createFoundrySceneQueryService(wiring: SceneWiring = {}): SceneQueryService {
  const gameProvider = wiring.gameProvider ?? defaultSceneGameProvider;
  return new SceneQueryService({
    scenes: new FoundrySceneLocator(gameProvider),
    reader: new FoundrySceneReader(gameProvider),
    collisions: new FoundryMovementCollisions(wiring.canvasGlobals),
    viewport: new FoundrySceneViewport(wiring.canvasGlobals)
  });
}

export function createFoundrySceneSettingsService(wiring: SceneWiring = {}): SceneSettingsService {
  const gameProvider = wiring.gameProvider ?? defaultSceneGameProvider;
  const directory = new FoundrySceneDirectory(gameProvider, wiring.canvasGlobals);
  return new SceneSettingsService({
    scenes: new FoundrySceneLocator(gameProvider),
    store: new FoundrySceneStore(gameProvider, wiring.sceneClass),
    query: createFoundrySceneQueryService(wiring),
    settings: new FoundrySceneSettingsReader(gameProvider),
    links: directory,
    weather: directory,
    levels: new FoundrySceneLevelStore(gameProvider)
  });
}

export function createFoundrySceneLevelService(wiring: SceneWiring = {}): SceneLevelService {
  const gameProvider = wiring.gameProvider ?? defaultSceneGameProvider;
  return new SceneLevelService({
    scenes: new FoundrySceneLocator(gameProvider),
    levels: new FoundrySceneLevelStore(gameProvider)
  });
}

export function createFoundrySceneTableService(wiring: SceneWiring = {}): SceneTableService {
  const gameProvider = wiring.gameProvider ?? defaultSceneGameProvider;
  const table = new FoundrySceneTable(gameProvider);
  return new SceneTableService({
    scenes: new FoundrySceneLocator(gameProvider),
    navigator: new FoundrySceneStore(gameProvider, wiring.sceneClass),
    broadcast: table,
    users: new FoundrySceneDirectory(gameProvider, wiring.canvasGlobals),
    levels: new FoundrySceneLevelStore(gameProvider),
    thumbnails: table
  });
}
