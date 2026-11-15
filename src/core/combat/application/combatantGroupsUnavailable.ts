import { CoreFeatureUnavailableError } from '@/core/shared';

export function combatantGroupsUnavailable(): CoreFeatureUnavailableError {
  return new CoreFeatureUnavailableError('Combatant groups require Foundry 13 or newer');
}
