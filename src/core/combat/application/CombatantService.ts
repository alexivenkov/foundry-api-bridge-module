import {
  TargetTokenNotFoundError,
  TokenHasNoActorError,
  requireScene,
  type SceneLocator
} from '@/core/shared';
import {
  CombatantCreationFailedError,
  CombatantGroupNotFoundError,
  CombatantLostError,
  CombatantNotFoundError,
  NoCombatantIdsError,
  TokenActorMismatchError,
  TokenAlreadyInCombatError,
  hasCombatantChanges,
  hasTokenCombatant,
  initiativeScoreOf,
  rolledInitiativeScores,
  type CombatLocator,
  type CombatTokenReader,
  type Combatant,
  type CombatantChanges,
  type CombatantDraft,
  type CombatantGroupReader,
  type CombatantStore,
  type InitiativeScore,
  type InitiativeStore
} from '@/core/combat/domain';
import type {
  AddCombatantCommand,
  CombatantAddress,
  RollAllInitiativeCommand,
  RollInitiativeCommand,
  SetCombatantDefeatedCommand,
  SetInitiativeCommand,
  TokenCombatantRequest,
  UpdateCombatantCommand
} from './commands';
import { combatantGroupsUnavailable } from './combatantGroupsUnavailable';
import { requireCombat } from './requireCombat';

export interface CombatantServiceDependencies {
  readonly combats: CombatLocator;
  readonly combatants: CombatantStore;
  readonly initiative: InitiativeStore;
  // Optional so the commands that predate groups and token lookup need no
  // more; the composition root always provides them.
  readonly groups?: CombatantGroupReader | undefined;
  readonly scenes?: SceneLocator | undefined;
  readonly tokens?: CombatTokenReader | undefined;
}

/** The participants of an encounter and their initiative. */
export class CombatantService {
  constructor(private readonly deps: CombatantServiceDependencies) {}

  /**
   * A draft names its actor and token as given. A token request is looked up
   * first and added as the core adds a token; a token already in the
   * encounter is refused.
   */
  async addCombatant(command: AddCombatantCommand): Promise<Combatant> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    const groupId = command.token !== undefined ? command.token.groupId : command.draft.groupId;
    if (groupId !== undefined) {
      this.requireGroup(combat.id, groupId);
    }
    const draft = command.token !== undefined ? this.tokenDraft(combat.id, command.token) : command.draft;

    const combatant = await this.deps.combatants.addCombatant(combat.id, draft);
    if (combatant === null) {
      throw new CombatantCreationFailedError();
    }
    return combatant;
  }

  async removeCombatant(command: CombatantAddress): Promise<void> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    this.requireCombatant(combat.id, command.combatantId);
    await this.deps.combatants.removeCombatant(combat.id, command.combatantId);
  }

  /** An update that names no attribute changes nothing and is not sent. */
  async updateCombatant(command: UpdateCombatantCommand): Promise<Combatant> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    const combatant = this.requireCombatant(combat.id, command.combatantId);
    if (!hasCombatantChanges(command.changes)) {
      return combatant;
    }
    const { groupId } = command.changes;
    if (groupId === null) {
      this.requireGroupsAvailable();
    } else if (groupId !== undefined) {
      this.requireGroup(combat.id, groupId);
    }
    return this.applyChanges(combat.id, command.combatantId, command.changes);
  }

  async setDefeated(command: SetCombatantDefeatedCommand): Promise<Combatant> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    this.requireCombatant(combat.id, command.combatantId);
    return this.applyChanges(combat.id, command.combatantId, { defeated: command.defeated });
  }

  async toggleVisibility(command: CombatantAddress): Promise<Combatant> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    const combatant = this.requireCombatant(combat.id, command.combatantId);
    return this.applyChanges(combat.id, command.combatantId, { hidden: !combatant.hidden });
  }

  async setInitiative(command: SetInitiativeCommand): Promise<Combatant> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    this.requireCombatant(combat.id, command.combatantId);
    await this.deps.initiative.setInitiative(combat.id, command.combatantId, command.initiative);

    const updated = this.deps.combatants.findCombatant(combat.id, command.combatantId);
    if (updated === null) {
      throw new CombatantLostError();
    }
    return updated;
  }

  /** Nothing is rolled unless every named combatant exists. */
  async rollInitiative(command: RollInitiativeCommand): Promise<InitiativeScore[]> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    if (command.combatantIds.length === 0) {
      throw new NoCombatantIdsError();
    }
    for (const combatantId of command.combatantIds) {
      this.requireCombatant(combat.id, combatantId);
    }

    await this.deps.initiative.rollInitiative(combat.id, command.combatantIds, command.options);

    return command.combatantIds.map((combatantId) =>
      initiativeScoreOf(combatantId, this.deps.combatants.findCombatant(combat.id, combatantId))
    );
  }

  /** Rolls for the combatants that have no initiative yet, and reports what it rolled. */
  async rollAllInitiative(command: RollAllInitiativeCommand): Promise<InitiativeScore[]> {
    const combat = requireCombat(this.deps.combats, command.combatId);
    const before = this.deps.combatants.listCombatants(combat.id);
    if (before.length === 0) {
      return [];
    }

    if (command.npcsOnly) {
      await this.deps.initiative.rollNpcs(combat.id, command.options);
    } else {
      await this.deps.initiative.rollAll(combat.id, command.options);
    }

    return rolledInitiativeScores(before, this.deps.combatants.listCombatants(combat.id));
  }

  private requireCombatant(combatId: string, combatantId: string): Combatant {
    const combatant = this.deps.combatants.findCombatant(combatId, combatantId);
    if (combatant === null) {
      throw new CombatantNotFoundError(combatantId);
    }
    return combatant;
  }

  private async applyChanges(combatId: string, combatantId: string, changes: CombatantChanges): Promise<Combatant> {
    const updated = await this.deps.combatants.updateCombatant(combatId, combatantId, changes);
    if (updated === null) {
      throw new CombatantNotFoundError(combatantId);
    }
    return updated;
  }

  private requireGroupsAvailable(): CombatantGroupReader {
    const groups = wired(this.deps.groups, 'combatant groups');
    if (!groups.groupsAvailable()) {
      throw combatantGroupsUnavailable();
    }
    return groups;
  }

  private requireGroup(combatId: string, groupId: string): void {
    if (this.requireGroupsAvailable().findGroup(combatId, groupId) === null) {
      throw new CombatantGroupNotFoundError(groupId);
    }
  }

  /** The token is looked up on the scene named, else the encounter's, else the active one. */
  private tokenDraft(combatId: string, request: TokenCombatantRequest): CombatantDraft {
    const tokens = wired(this.deps.tokens, 'token lookup');
    const sceneId = request.sceneId ?? tokens.linkedSceneId(combatId) ?? undefined;
    const scene = requireScene(wired(this.deps.scenes, 'scene lookup'), sceneId);

    const token = tokens.findToken(scene.id, request.tokenId);
    if (token === null) {
      throw new TargetTokenNotFoundError(request.tokenId);
    }
    if (token.actorId === null) {
      throw new TokenHasNoActorError(token.id);
    }
    if (request.actorId !== undefined && request.actorId !== token.actorId) {
      throw new TokenActorMismatchError(token.id, request.actorId);
    }
    if (hasTokenCombatant(this.deps.combatants.listCombatants(combatId), token.id)) {
      throw new TokenAlreadyInCombatError(token.id);
    }

    return {
      actorId: token.actorId,
      tokenId: token.id,
      sceneId: token.sceneId,
      initiative: request.initiative,
      hidden: request.hidden ?? token.hidden,
      groupId: request.groupId
    };
  }
}

function wired<T>(dependency: T | undefined, what: string): T {
  if (dependency === undefined) {
    throw new Error(`CombatantService was built without ${what}`);
  }
  return dependency;
}
