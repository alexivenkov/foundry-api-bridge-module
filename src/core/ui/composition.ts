import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { CanvasStageService, CanvasViewService, GridService, NotificationCenterService } from './application';
import {
  FoundryCanvasStage,
  FoundryCanvasViewport,
  FoundryNotificationCenter,
  FoundrySceneGrids,
  type CanvasProvider,
  type FoundryGridGame,
  type GridGameProvider,
  type StageGlobalsProvider,
  type UiProvider
} from './infrastructure';

// Composition root of the context. Handlers pass custom providers only in tests;
// by default the gateways read `ui`, `canvas` and `game` when a command arrives.

export const defaultGridGameProvider: GridGameProvider = globalGameProvider<FoundryGridGame>();

export interface GridWiring {
  readonly gameProvider?: GridGameProvider | undefined;
  readonly generation?: (() => number) | undefined;
}

export interface CanvasStageWiring {
  readonly globals?: StageGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
}

export function createFoundryNotificationCenterService(ui?: UiProvider): NotificationCenterService {
  return new NotificationCenterService({ notifications: new FoundryNotificationCenter(ui) });
}

export function createFoundryCanvasViewService(canvas?: CanvasProvider): CanvasViewService {
  return new CanvasViewService({ viewport: new FoundryCanvasViewport(canvas) });
}

export function createFoundryGridService(wiring: GridWiring = {}): GridService {
  const gameProvider = wiring.gameProvider ?? defaultGridGameProvider;
  return new GridService({
    scenes: new FoundrySceneLocator(gameProvider),
    grids: new FoundrySceneGrids(gameProvider, wiring.generation)
  });
}

export function createFoundryCanvasStageService(wiring: CanvasStageWiring = {}): CanvasStageService {
  return new CanvasStageService({ stage: new FoundryCanvasStage(wiring.globals, wiring.generation) });
}
