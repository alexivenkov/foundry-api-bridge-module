import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { DrawingService } from './application';
import { FoundryDrawingStore, type DrawingGameProvider, type FoundryDrawingGame } from './infrastructure';

export const defaultDrawingGameProvider: DrawingGameProvider = globalGameProvider<FoundryDrawingGame>();

// Composition root of the context. Handlers pass a custom provider only in tests.
export function createFoundryDrawingService(
  gameProvider: DrawingGameProvider = defaultDrawingGameProvider
): DrawingService {
  const store = new FoundryDrawingStore(gameProvider);
  return new DrawingService({ scenes: new FoundrySceneLocator(gameProvider), drawings: store, authors: store });
}
