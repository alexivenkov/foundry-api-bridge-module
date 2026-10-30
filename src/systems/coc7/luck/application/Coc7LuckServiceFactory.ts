import type { Coc7LuckPort } from '@/systems/coc7/luck/domain';
import { Coc7LuckService } from './Coc7LuckService';

export interface Coc7LuckServiceDependencies {
  readonly luck: Coc7LuckPort;
}

export function createCoc7LuckService(deps: Coc7LuckServiceDependencies): Coc7LuckService {
  return new Coc7LuckService(deps.luck);
}
