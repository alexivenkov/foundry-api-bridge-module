import type { TestRegionPointParams, TestRegionPointResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryRegionService, testRegionPointRequestSchema, toTestRegionPointQuery } from '@/core/regions';
import type { RegionHandlerDependencies } from './GetRegionsHandler';
import { runSync } from './runSync';

export function createTestRegionPointHandler(
  deps: RegionHandlerDependencies = {}
): (params: TestRegionPointParams) => Promise<TestRegionPointResult> {
  const service = createFoundryRegionService(deps);

  return function testRegionPointHandler(params: TestRegionPointParams): Promise<TestRegionPointResult> {
    return runSync(() => {
      const result = service.testPoint(toTestRegionPointQuery(parseRequest(testRegionPointRequestSchema, params)));
      return {
        sceneId: result.sceneId,
        regionId: result.regionId,
        x: result.point.x,
        y: result.point.y,
        elevation: result.point.elevation,
        inside: result.inside
      };
    });
  };
}

export const testRegionPointHandler = createTestRegionPointHandler();
