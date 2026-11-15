import {
  CombatantGroupCreationFailedError,
  CombatantGroupNotFoundError,
  hasGroupChanges,
  type CombatLocator,
  type CombatantGroup,
  type CombatantGroupStore
} from '@/core/combat/domain';
import type {
  CombatAddress,
  CombatantGroupAddress,
  CreateCombatantGroupCommand,
  UpdateCombatantGroupCommand
} from './commands';
import { combatantGroupsUnavailable } from './combatantGroupsUnavailable';
import { requireCombat } from './requireCombat';

export interface CombatantGroupServiceDependencies {
  readonly combats: CombatLocator;
  readonly groups: CombatantGroupStore;
}

export interface CombatantGroupList {
  readonly combatId: string;
  readonly groups: readonly CombatantGroup[];
}

export interface CombatantGroupOutcome {
  readonly combatId: string;
  readonly group: CombatantGroup;
}

export interface DeletedCombatantGroup {
  readonly combatId: string;
  readonly groupId: string;
}

/** Foundry 13+: the groups of an encounter. Membership is set on the combatants. */
export class CombatantGroupService {
  constructor(private readonly deps: CombatantGroupServiceDependencies) {}

  listGroups(query: CombatAddress): CombatantGroupList {
    const combatId = this.requireCombatWithGroups(query);
    return { combatId, groups: this.deps.groups.listGroups(combatId) };
  }

  async createGroup(command: CreateCombatantGroupCommand): Promise<CombatantGroupOutcome> {
    const combatId = this.requireCombatWithGroups(command);
    const group = await this.deps.groups.createGroup(combatId, command.draft);
    if (group === null) {
      throw new CombatantGroupCreationFailedError();
    }
    return { combatId, group };
  }

  /** An update that names no attribute changes nothing and is not sent. */
  async updateGroup(command: UpdateCombatantGroupCommand): Promise<CombatantGroupOutcome> {
    const combatId = this.requireCombatWithGroups(command);
    const current = this.requireGroup(combatId, command.groupId);
    if (!hasGroupChanges(command.changes)) {
      return { combatId, group: current };
    }
    const group = await this.deps.groups.updateGroup(combatId, command.groupId, command.changes);
    if (group === null) {
      throw new CombatantGroupNotFoundError(command.groupId);
    }
    return { combatId, group };
  }

  /** The members stay in the encounter; the core ignores the group they still name. */
  async deleteGroup(command: CombatantGroupAddress): Promise<DeletedCombatantGroup> {
    const combatId = this.requireCombatWithGroups(command);
    this.requireGroup(combatId, command.groupId);
    await this.deps.groups.deleteGroup(combatId, command.groupId);
    return { combatId, groupId: command.groupId };
  }

  private requireCombatWithGroups(address: CombatAddress): string {
    if (!this.deps.groups.groupsAvailable()) {
      throw combatantGroupsUnavailable();
    }
    return requireCombat(this.deps.combats, address.combatId).id;
  }

  private requireGroup(combatId: string, groupId: string): CombatantGroup {
    const group = this.deps.groups.findGroup(combatId, groupId);
    if (group === null) {
      throw new CombatantGroupNotFoundError(groupId);
    }
    return group;
  }
}
