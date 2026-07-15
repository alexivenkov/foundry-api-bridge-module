import type { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';
import type {
  ItemRarity,
  ItemType,
  SpellSchool
} from '@/filtering/items/domain/value-objects';

// The world-only folder filter is deliberately absent: pack folders are not
// world folders. Pack targeting (packIds) lives on the repository, not in
// the query.
export interface FilterCompendiumItemsQuery {
  readonly name?: SubstringQuery;
  readonly types?: EnumSet<ItemType>;
  readonly rarities?: EnumSet<ItemRarity>;
  readonly spellSchools?: EnumSet<SpellSchool>;
  readonly requiresAttunement?: boolean;
  readonly identified?: boolean;
  readonly hasActivities?: boolean;
  readonly isContainer?: boolean;
  readonly weight?: Range;
  readonly price?: Range;
  readonly spellLevel?: Range;
  readonly pagination: PaginationParams;
}
