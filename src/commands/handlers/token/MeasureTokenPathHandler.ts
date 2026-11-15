import type { MeasureTokenPathParams, MeasureTokenPathResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenCoreMovementService, measureTokenPathRequestSchema, toMeasureTokenPathQuery } from '@/core/tokens';
import { toWireMeasurement, type TokenMovementHandlerDependencies } from './tokenMovementWireMappers';

export function createMeasureTokenPathHandler(
  deps: TokenMovementHandlerDependencies = {}
): (params: MeasureTokenPathParams) => Promise<MeasureTokenPathResult> {
  const service = createFoundryTokenCoreMovementService(deps);

  return function measureTokenPathHandler(params: MeasureTokenPathParams): Promise<MeasureTokenPathResult> {
    try {
      const result = service.measure(toMeasureTokenPathQuery(parseRequest(measureTokenPathRequestSchema, params)));
      return Promise.resolve(toWireMeasurement(result));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const measureTokenPathHandler = createMeasureTokenPathHandler();
