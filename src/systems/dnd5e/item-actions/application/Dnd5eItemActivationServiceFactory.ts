import type {
  ItemActivationPort,
  MidiWorkflowPort,
  TargetingPort
} from '@/systems/dnd5e/item-actions/domain';
import { Dnd5eItemActivationService } from './Dnd5eItemActivationService';

export interface Dnd5eItemActivationServiceDependencies {
  readonly activation: ItemActivationPort;
  readonly targeting: TargetingPort;
  readonly midi: MidiWorkflowPort;
}

export function createDnd5eItemActivationService(
  deps: Dnd5eItemActivationServiceDependencies
): Dnd5eItemActivationService {
  return new Dnd5eItemActivationService(deps.activation, deps.targeting, deps.midi);
}
