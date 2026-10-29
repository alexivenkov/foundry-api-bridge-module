import type { SwadeBenniesPort } from '@/systems/swade/bennies/domain';
import { SwadeBenniesService } from './SwadeBenniesService';

export interface SwadeBenniesServiceDependencies {
  readonly bennies: SwadeBenniesPort;
}

export function createSwadeBenniesService(deps: SwadeBenniesServiceDependencies): SwadeBenniesService {
  return new SwadeBenniesService(deps.bennies);
}
