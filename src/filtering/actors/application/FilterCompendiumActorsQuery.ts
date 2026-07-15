import type {
  EnumSet,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/kernel';
import type {
  ActorType,
  CreatureType,
  Disposition,
  Size
} from '@/filtering/actors/domain/value-objects';
import type { AbilityRangeMap } from '@/filtering/actors/domain/specifications';

// World-only filters (folder, hasPlayerOwner, currentHp) are deliberately
// absent: pack folders are not world folders, pack actors have no player
// owners, and their hit points are always full. Pack targeting (packIds)
// lives on the repository, not in the query.
export interface FilterCompendiumActorsQuery {
  readonly name?: SubstringQuery;
  readonly types?: EnumSet<ActorType>;
  readonly creatureTypes?: EnumSet<CreatureType>;
  readonly sizes?: EnumSet<Size>;
  readonly dispositions?: EnumSet<Disposition>;
  readonly cr?: Range;
  readonly level?: Range;
  readonly maxHp?: Range;
  readonly ac?: Range;
  readonly abilities?: AbilityRangeMap;
  readonly pagination: PaginationParams;
}
