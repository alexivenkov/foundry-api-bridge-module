import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { MeasuredTemplateService } from './application';
import {
  FoundryMeasuredTemplateStore,
  type FoundryTemplateGame,
  type TemplateConfigProvider,
  type TemplateGameProvider
} from './infrastructure';

export const defaultTemplateGameProvider: TemplateGameProvider = globalGameProvider<FoundryTemplateGame>();

export interface TemplateWiring {
  readonly gameProvider?: TemplateGameProvider;
  readonly config?: TemplateConfigProvider;
}

// Composition root of the context. Handlers pass custom providers only in tests.
export function createFoundryTemplateService(wiring: TemplateWiring = {}): MeasuredTemplateService {
  const gameProvider = wiring.gameProvider ?? defaultTemplateGameProvider;
  const store = new FoundryMeasuredTemplateStore(gameProvider, wiring.config);
  return new MeasuredTemplateService({
    scenes: new FoundrySceneLocator(gameProvider),
    templates: store,
    authors: store
  });
}
