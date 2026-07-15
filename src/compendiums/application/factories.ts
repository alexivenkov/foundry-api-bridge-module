import {
  CompendiumImportService,
  type CompendiumImportServiceDependencies
} from './CompendiumImportService';
import {
  CompendiumQueryService,
  type CompendiumQueryServiceDependencies
} from './CompendiumQueryService';

export function createCompendiumQueryService(
  deps: CompendiumQueryServiceDependencies
): CompendiumQueryService {
  return new CompendiumQueryService(deps);
}

export function createCompendiumImportService(
  deps: CompendiumImportServiceDependencies
): CompendiumImportService {
  return new CompendiumImportService(deps);
}
