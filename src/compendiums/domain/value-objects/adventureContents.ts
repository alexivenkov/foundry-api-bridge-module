import type {
  AdventureContent,
  AdventureDocumentGroup,
  AdventureImportPlan
} from '@/compendiums/domain/model';

/** One entry per content type in the plan's order; documents to update exist in the world. */
export function adventureContents(plan: AdventureImportPlan): readonly AdventureContent[] {
  const byType = new Map<string, { id: string; name: string; existsInWorld: boolean }[]>();
  const add = (groups: readonly AdventureDocumentGroup[], existsInWorld: boolean): void => {
    for (const group of groups) {
      const entries = byType.get(group.documentType) ?? [];
      for (const document of group.documents) {
        entries.push({ id: document.id, name: document.name, existsInWorld });
      }
      byType.set(group.documentType, entries);
    }
  };
  add(plan.toCreate, false);
  add(plan.toUpdate, true);
  return [...byType].map(([documentType, entries]) => ({ documentType, entries }));
}

export function countDocuments(groups: readonly AdventureDocumentGroup[]): number {
  return groups.reduce((total, group) => total + group.documents.length, 0);
}

/** `Actor 2, Scene 1` */
export function summarizeGroups(groups: readonly AdventureDocumentGroup[]): string {
  return groups
    .filter(group => group.documents.length > 0)
    .map(group => `${group.documentType} ${String(group.documents.length)}`)
    .join(', ');
}
