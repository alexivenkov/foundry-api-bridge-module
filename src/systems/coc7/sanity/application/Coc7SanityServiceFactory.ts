import type { Coc7SanityPort } from '@/systems/coc7/sanity/domain';
import { Coc7SanityService } from './Coc7SanityService';

export interface Coc7SanityServiceDependencies {
  readonly sanity: Coc7SanityPort;
}

export function createCoc7SanityService(deps: Coc7SanityServiceDependencies): Coc7SanityService {
  return new Coc7SanityService(deps.sanity);
}
