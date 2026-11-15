export * from './domain';
export * from './application';
export * from './validation';
export {
  createFoundryRegionBehaviorService,
  createFoundryRegionService,
  defaultRegionGameProvider
} from './composition';
export type { RegionWiring } from './composition';
export type { RegionGameProvider, RegionGlobalsProvider } from './infrastructure';
