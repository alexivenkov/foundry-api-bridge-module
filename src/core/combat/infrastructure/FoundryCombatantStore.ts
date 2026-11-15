import type {
  Combatant,
  CombatantChanges,
  CombatantDraft,
  CombatantStore,
  InitiativeRollOptions,
  InitiativeStore
} from '@/core/combat/domain';
import { requireCombatDocument, type CombatGameProvider } from './combatDocuments';
import {
  toCombatant,
  toFoundryCombatantChanges,
  toFoundryCombatantData,
  toFoundryInitiativeOptions
} from './combatMapper';
import type { FoundryCombatDocument } from './foundryCombatTypes';

/** Anti-corruption layer over a combat's embedded Combatant documents and their initiative. */
export class FoundryCombatantStore implements CombatantStore, InitiativeStore {
  constructor(private readonly gameProvider: CombatGameProvider) {}

  listCombatants(combatId: string): readonly Combatant[] {
    return this.require(combatId).combatants.contents.map(toCombatant);
  }

  findCombatant(combatId: string, combatantId: string): Combatant | null {
    const document = this.require(combatId).combatants.get(combatantId);
    return document ? toCombatant(document) : null;
  }

  async addCombatant(combatId: string, draft: CombatantDraft): Promise<Combatant | null> {
    const created = await this.require(combatId).createEmbeddedDocuments('Combatant', [
      toFoundryCombatantData(draft)
    ]);
    const document = created[0];
    return document ? toCombatant(document) : null;
  }

  async updateCombatant(
    combatId: string,
    combatantId: string,
    changes: CombatantChanges
  ): Promise<Combatant | null> {
    const document = this.require(combatId).combatants.get(combatantId);
    if (!document) {
      return null;
    }
    await document.update(toFoundryCombatantChanges(changes));
    return toCombatant(document);
  }

  async removeCombatant(combatId: string, combatantId: string): Promise<void> {
    await this.require(combatId).deleteEmbeddedDocuments('Combatant', [combatantId]);
  }

  async setInitiative(combatId: string, combatantId: string, initiative: number | null): Promise<void> {
    await this.require(combatId).setInitiative(combatantId, initiative);
  }

  async rollInitiative(
    combatId: string,
    combatantIds: readonly string[],
    options: InitiativeRollOptions
  ): Promise<void> {
    await this.require(combatId).rollInitiative([...combatantIds], toFoundryInitiativeOptions(options));
  }

  async rollAll(combatId: string, options: InitiativeRollOptions): Promise<void> {
    await this.require(combatId).rollAll(toFoundryInitiativeOptions(options));
  }

  async rollNpcs(combatId: string, options: InitiativeRollOptions): Promise<void> {
    await this.require(combatId).rollNPC(toFoundryInitiativeOptions(options));
  }

  private require(combatId: string): FoundryCombatDocument {
    return requireCombatDocument(this.gameProvider, combatId);
  }
}
