import { foundryGeneration } from '@/compat/foundryVersion';
import type {
  CombatantGroup,
  CombatantGroupChanges,
  CombatantGroupDraft,
  CombatantGroupStore
} from '@/core/combat/domain';
import { COMBATANT_GROUPS_SINCE } from './combatMapper';
import { toCombatantGroup, toFoundryGroupChanges, toFoundryGroupData } from './combatantGroupMapper';
import { requireEncounterDocument } from './encounterDocuments';
import type { FoundryCombatantGroupDocument } from './foundryCombatantGroupTypes';
import type { CombatWorldGameProvider } from './foundryEncounterTypes';

/** Anti-corruption layer over a combat's embedded CombatantGroup documents (Foundry 13+). */
export class FoundryCombatantGroupStore implements CombatantGroupStore {
  constructor(private readonly worldProvider: CombatWorldGameProvider) {}

  groupsAvailable(): boolean {
    return foundryGeneration() >= COMBATANT_GROUPS_SINCE;
  }

  listGroups(combatId: string): readonly CombatantGroup[] {
    return this.groupsOf(combatId).map(toCombatantGroup);
  }

  findGroup(combatId: string, groupId: string): CombatantGroup | null {
    const document = this.findDocument(combatId, groupId);
    return document ? toCombatantGroup(document) : null;
  }

  async createGroup(combatId: string, draft: CombatantGroupDraft): Promise<CombatantGroup | null> {
    const created = await requireEncounterDocument(this.worldProvider, combatId).createEmbeddedDocuments(
      'CombatantGroup',
      [toFoundryGroupData(draft)]
    );
    const document = created[0];
    return document ? toCombatantGroup(document) : null;
  }

  async updateGroup(
    combatId: string,
    groupId: string,
    changes: CombatantGroupChanges
  ): Promise<CombatantGroup | null> {
    const document = this.findDocument(combatId, groupId);
    if (!document) {
      return null;
    }
    await document.update(toFoundryGroupChanges(changes));
    return toCombatantGroup(document);
  }

  async deleteGroup(combatId: string, groupId: string): Promise<void> {
    await this.findDocument(combatId, groupId)?.delete();
  }

  private groupsOf(combatId: string): FoundryCombatantGroupDocument[] {
    return requireEncounterDocument(this.worldProvider, combatId).groups?.contents ?? [];
  }

  private findDocument(combatId: string, groupId: string): FoundryCombatantGroupDocument | undefined {
    return requireEncounterDocument(this.worldProvider, combatId).groups?.get(groupId);
  }
}
