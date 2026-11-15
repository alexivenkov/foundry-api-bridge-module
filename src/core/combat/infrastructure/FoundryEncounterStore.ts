import type { Combat, CombatIdentity, CombatLocator, Encounter, EncounterStore } from '@/core/combat/domain';
import { toCombat } from './combatMapper';
import { findEncounterDocument, requireEncounterDocument } from './encounterDocuments';
import { toEncounter } from './encounterMapper';
import type { CombatWorldGameProvider, FoundryEncounterDocument } from './foundryEncounterTypes';

/** Anti-corruption layer over the world's Combat documents as whole encounters. */
export class FoundryEncounterStore implements CombatLocator, EncounterStore {
  constructor(private readonly worldProvider: CombatWorldGameProvider) {}

  findCombat(combatId: string): CombatIdentity | null {
    const document = findEncounterDocument(this.worldProvider.getGame(), combatId);
    return document !== undefined ? { id: document.id } : null;
  }

  /** `game.combat`: the encounter the combat tracker shows, as for every other combat command. */
  findActiveCombat(): CombatIdentity | null {
    const document = this.worldProvider.getGame().combat;
    return document ? { id: document.id } : null;
  }

  listEncounters(): readonly Encounter[] {
    const game = this.worldProvider.getGame();
    const defaultId = game.combat?.id ?? null;
    return game.combats.contents.map((document) => toEncounter(document, defaultId));
  }

  readEncounter(combatId: string): Encounter {
    return this.encounterOf(this.require(combatId));
  }

  async activate(combatId: string): Promise<Encounter> {
    const document = this.require(combatId);
    await document.activate();
    return this.encounterOf(document);
  }

  async linkScene(combatId: string, sceneId: string | null): Promise<Encounter> {
    const document = this.require(combatId);
    await document.update({ scene: sceneId });
    return this.encounterOf(document);
  }

  async nextRound(combatId: string): Promise<Combat> {
    const document = this.require(combatId);
    return toCombat((await document.nextRound()) ?? document);
  }

  async previousRound(combatId: string): Promise<Combat> {
    const document = this.require(combatId);
    return toCombat((await document.previousRound()) ?? document);
  }

  async resetInitiative(combatId: string): Promise<Combat> {
    const document = this.require(combatId);
    await document.resetAll();
    return toCombat(document);
  }

  private encounterOf(document: FoundryEncounterDocument): Encounter {
    return toEncounter(document, this.worldProvider.getGame().combat?.id ?? null);
  }

  private require(combatId: string): FoundryEncounterDocument {
    return requireEncounterDocument(this.worldProvider, combatId);
  }
}
