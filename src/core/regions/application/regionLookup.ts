import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  RegionNotFoundError,
  type Region,
  type RegionFeatures,
  type RegionStore
} from '@/core/regions/domain';

export function requireRegionFeatures(regions: RegionStore): RegionFeatures {
  const features = regions.features();
  if (!features.available) {
    throw new CoreFeatureUnavailableError('Regions require Foundry 12 or newer');
  }
  return features;
}

export function requireRegion(regions: RegionStore, sceneId: string, regionId: string): Region {
  const region = regions.findRegion(sceneId, regionId);
  if (region === null) {
    throw new RegionNotFoundError(regionId);
  }
  return region;
}
