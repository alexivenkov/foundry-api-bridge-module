import { UserService } from './application';
import { FoundryUserDirectory, type UserGlobalsProvider } from './infrastructure';

export interface UserWiring {
  readonly globals?: UserGlobalsProvider;
}

// Composition root of the context. Handlers pass custom wiring only in tests.
export function createFoundryUserService(wiring: UserWiring = {}): UserService {
  return new UserService({ users: new FoundryUserDirectory(wiring.globals) });
}
