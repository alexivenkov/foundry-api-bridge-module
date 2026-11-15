import type { MeasureGridPathParams, MeasureGridPathResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryGridService,
  measureGridPathRequestSchema,
  toMeasureGridPathCommand,
  type GridWiring
} from '@/core/ui';
import { toWireGridMeasurement } from './canvasWireMappers';

export type GridHandlerDependencies = GridWiring;

export function createMeasureGridPathHandler(
  deps: GridHandlerDependencies = {}
): (params: MeasureGridPathParams) => Promise<MeasureGridPathResult> {
  const service = createFoundryGridService(deps);

  return function measureGridPathHandler(params: MeasureGridPathParams): Promise<MeasureGridPathResult> {
    try {
      const result = service.measurePath(toMeasureGridPathCommand(parseRequest(measureGridPathRequestSchema, params)));
      return Promise.resolve({
        sceneId: result.sceneId,
        gridType: result.grid.type,
        units: result.grid.units,
        diagonalRule: result.grid.diagonalRule,
        ...toWireGridMeasurement(result.measurement),
        segments: result.measurement.segments.map(toWireGridMeasurement)
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const measureGridPathHandler = createMeasureGridPathHandler();
