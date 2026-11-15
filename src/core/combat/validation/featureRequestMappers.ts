import { emptyAsAbsent } from '@/core/shared';
import type {
  CombatAddress,
  CombatantGroupAddress,
  CreateCombatantGroupCommand,
  ToggleSceneLinkCommand,
  UpdateCombatantGroupCommand,
  UpdateTrackerConfigCommand
} from '@/core/combat/application';
import type {
  CombatantGroupAddressRequest,
  CombatantGroupsRequest,
  CreateCombatantGroupRequest,
  UpdateCombatantGroupRequest
} from './combatantGroupSchemas';
import type { EncounterAddressRequest, ToggleCombatSceneLinkRequest } from './encounterSchemas';
import type { UpdateCombatTrackerConfigRequest } from './trackerConfigSchemas';

export function toEncounterAddress(request: EncounterAddressRequest | CombatantGroupsRequest): CombatAddress {
  return { combatId: emptyAsAbsent(request.combatId) };
}

export function toToggleSceneLinkCommand(request: ToggleCombatSceneLinkRequest): ToggleSceneLinkCommand {
  return { combatId: emptyAsAbsent(request.combatId), sceneId: emptyAsAbsent(request.sceneId) };
}

export function toCreateCombatantGroupCommand(request: CreateCombatantGroupRequest): CreateCombatantGroupCommand {
  return {
    combatId: emptyAsAbsent(request.combatId),
    draft: { name: request.name, img: request.img, initiative: request.initiative }
  };
}

export function toUpdateCombatantGroupCommand(request: UpdateCombatantGroupRequest): UpdateCombatantGroupCommand {
  return {
    combatId: emptyAsAbsent(request.combatId),
    groupId: request.groupId,
    changes: { name: request.name, img: request.img, initiative: request.initiative }
  };
}

export function toCombatantGroupAddress(request: CombatantGroupAddressRequest): CombatantGroupAddress {
  return { combatId: emptyAsAbsent(request.combatId), groupId: request.groupId };
}

export function toUpdateTrackerConfigCommand(request: UpdateCombatTrackerConfigRequest): UpdateTrackerConfigCommand {
  const marker = request.turnMarker;
  return {
    changes: {
      resource: request.resource,
      skipDefeated: request.skipDefeated,
      turnMarker:
        marker === undefined
          ? undefined
          : {
              enabled: marker.enabled,
              animation: marker.animation,
              src: marker.src,
              disposition: marker.disposition
            }
    }
  };
}
