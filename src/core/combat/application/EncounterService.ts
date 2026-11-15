import { requireScene, type SceneLocator } from '@/core/shared';
import {
  CombatNotStartedError,
  CombatSceneLinkRefusedError,
  canLinkToScene,
  type Combat,
  type CombatLocator,
  type Encounter,
  type EncounterStore
} from '@/core/combat/domain';
import type { CombatAddress, ToggleSceneLinkCommand } from './commands';
import { requireCombat } from './requireCombat';

export interface EncounterServiceDependencies {
  readonly combats: CombatLocator;
  readonly encounters: EncounterStore;
  readonly scenes: SceneLocator;
}

/** The encounters of the world: which one is active, where it is shown, and its rounds. */
export class EncounterService {
  constructor(private readonly deps: EncounterServiceDependencies) {}

  listEncounters(): readonly Encounter[] {
    return this.deps.encounters.listEncounters();
  }

  /** The server deactivates every other encounter of the world. */
  async activateCombat(command: CombatAddress): Promise<Encounter> {
    return this.deps.encounters.activate(requireCombat(this.deps.combats, command.combatId).id);
  }

  /**
   * Unlinks a linked encounter, or links an unlinked one to the scene named,
   * else the active scene. The core's own toggle picks the scene the GM views
   * and refuses with a notification only a person at the table would see.
   */
  async toggleSceneLink(command: ToggleSceneLinkCommand): Promise<Encounter> {
    const encounter = this.deps.encounters.readEncounter(requireCombat(this.deps.combats, command.combatId).id);
    if (encounter.sceneId !== null) {
      return this.deps.encounters.linkScene(encounter.id, null);
    }
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (!canLinkToScene(encounter, scene.id)) {
      throw new CombatSceneLinkRefusedError(scene.id);
    }
    return this.deps.encounters.linkScene(encounter.id, scene.id);
  }

  async nextRound(command: CombatAddress): Promise<Combat> {
    return this.deps.encounters.nextRound(this.requireStarted(command).id);
  }

  /** From the first round this goes back to before the start, as the core's own rewind does. */
  async previousRound(command: CombatAddress): Promise<Combat> {
    return this.deps.encounters.previousRound(this.requireStarted(command).id);
  }

  /** A group keeps its initiative; its members go on reading it. */
  async resetInitiative(command: CombatAddress): Promise<Combat> {
    return this.deps.encounters.resetInitiative(requireCombat(this.deps.combats, command.combatId).id);
  }

  private requireStarted(address: CombatAddress): Encounter {
    const encounter = this.deps.encounters.readEncounter(requireCombat(this.deps.combats, address.combatId).id);
    if (!encounter.started) {
      throw new CombatNotStartedError();
    }
    return encounter;
  }
}
