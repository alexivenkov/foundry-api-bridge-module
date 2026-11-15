import type { SceneSummary } from '@/commands/types';
import {
  toScene,
  type FoundrySceneDocument,
  type FoundrySceneSummaryFields
} from '@/core/scenes/infrastructure';
import { toWireScene } from './sceneWireMappers';

// The names the pre-migration handler tests build their mocks and assertions
// from. The code behind them lives in `@/core/scenes`.

export {
  gridTypeFromCode as gridTypeNumberToString,
  gridTypeToCode as gridTypeStringToNumber
} from '@/core/scenes/infrastructure';

export type FoundrySceneCrud = FoundrySceneSummaryFields &
  Pick<FoundrySceneDocument, 'update' | 'delete' | 'clone' | 'view'>;

export function mapSceneToCrudSummary(scene: FoundrySceneCrud): SceneSummary {
  return toWireScene(toScene(scene));
}
