import type {
  EnumSet,
  FolderReference,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/kernel/domain/value-objects';
import type {
  ItemRarity,
  ItemType,
  SpellSchool
} from '@/filtering/items/domain/value-objects';

export interface FilterItemsQuery {
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
  readonly folder?: FolderReference;
  readonly pagination: PaginationParams;
}
