import {
  CombatAlreadyStartedError,
  CombatCreationCancelledError,
  CombatNotStartedError,
  CombatantNotInTurnOrderError,
  turnOf,
  type ActiveSceneReader,
  type Combat,
  type CombatLocator,
  type CombatStore
} from '@/core/combat/domain';
import type { CombatAddress, CreateCombatCommand, SetTurnCommand } from './commands';
import { requireCombat } from './requireCombat';

export interface CombatServiceDependencies {
  readonly combats: CombatLocator;
  readonly store: CombatStore;
  readonly scenes: ActiveSceneReader;
}

/** The life of an encounter and its turn order. */
export class CombatService {
  constructor(private readonly deps: CombatServiceDependencies) {}

  getCombat(query: CombatAddress): Combat {
    return this.deps.store.readCombat(requireCombat(this.deps.combats, query.combatId).id);
  }

  /** The scene is only linked here, at creation; with none named and none active the encounter has no scene. */
  async createCombat(command: CreateCombatCommand): Promise<Combat> {
    const sceneId =
      command.sceneId !== undefined ? command.sceneId : (this.deps.scenes.findActiveSceneId() ?? undefined);
    const combat = await this.deps.store.createCombat({ sceneId, activate: command.activate });
    if (combat === null) {
      throw new CombatCreationCancelledError();
    }
    return combat;
  }

  async startCombat(command: CombatAddress): Promise<Combat> {
    const combat = this.getCombat(command);
    if (combat.started) {
      throw new CombatAlreadyStartedError();
    }
    return this.deps.store.startCombat(combat.id);
  }

  /**
   * Ending an encounter removes it. The core's own "end combat" asks the GM to
   * confirm in a dialog, which nobody answers for a remote caller.
   */
  async endCombat(command: CombatAddress): Promise<void> {
    await this.deleteCombat(command);
  }

  async deleteCombat(command: CombatAddress): Promise<void> {
    await this.deps.store.deleteCombat(requireCombat(this.deps.combats, command.combatId).id);
  }

  async nextTurn(command: CombatAddress): Promise<Combat> {
    return this.deps.store.nextTurn(this.requireStarted(command).id);
  }

  async previousTurn(command: CombatAddress): Promise<Combat> {
    return this.deps.store.previousTurn(this.requireStarted(command).id);
  }

  /** Hands the turn straight to a combatant, without playing the turns in between. */
  async setTurn(command: SetTurnCommand): Promise<Combat> {
    const combat = this.requireStarted(command);
    const turn = turnOf(combat, command.combatantId);
    if (turn === null) {
      throw new CombatantNotInTurnOrderError(command.combatantId);
    }
    return this.deps.store.setTurn(combat.id, turn);
  }

  private requireStarted(address: CombatAddress): Combat {
    const combat = this.getCombat(address);
    if (!combat.started) {
      throw new CombatNotStartedError();
    }
    return combat;
  }
}
