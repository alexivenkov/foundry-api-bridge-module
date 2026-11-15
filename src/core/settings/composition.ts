import { SettingService } from './application';
import { FoundrySettingRegistry, MODULE_NAMESPACE, type SettingGlobalsProvider } from './infrastructure';

export interface SettingWiring {
  readonly globals?: SettingGlobalsProvider;
}

// Composition root of the context. Handlers pass custom wiring only in tests.
export function createFoundrySettingService(wiring: SettingWiring = {}): SettingService {
  return new SettingService({
    settings: new FoundrySettingRegistry(wiring.globals),
    protectedNamespace: MODULE_NAMESPACE
  });
}
