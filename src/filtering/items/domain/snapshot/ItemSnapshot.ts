import type { ItemRarity } from '../value-objects/ItemRarity';
import type { ItemType } from '../value-objects/ItemType';
import type { SpellSchool } from '../value-objects/SpellSchool';

export interface ItemSnapshot {
  readonly id: string;
  readonly name: string;
  readonly type: ItemType;
  readonly folderId: string | null;
  readonly rarity: ItemRarity | null;
  readonly identified: boolean | null;
  readonly requiresAttunement: boolean | null;
  readonly weight: number | null;
  readonly priceGp: number | null;
  readonly spellLevel: number | null;
  readonly spellSchool: SpellSchool | null;
  readonly hasActivities: boolean;
  readonly isContainer: boolean;
}
