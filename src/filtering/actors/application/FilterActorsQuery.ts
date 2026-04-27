import type {
  EnumSet,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/filtering/shared/domain/value-objects';
import type {
  ActorType,
  CreatureType,
  Disposition,
  FolderReference,
  Size
} from '@/filtering/actors/domain/value-objects';
import type { AbilityRangeMap } from '@/filtering/actors/domain/specifications';

export interface FilterActorsQuery {
  readonly name?: SubstringQuery;
  readonly types?: EnumSet<ActorType>;
  readonly creatureTypes?: EnumSet<CreatureType>;
  readonly sizes?: EnumSet<Size>;
  readonly dispositions?: EnumSet<Disposition>;
  readonly hasPlayerOwner?: boolean;
  readonly cr?: Range;
  readonly level?: Range;
  readonly maxHp?: Range;
  readonly currentHp?: Range;
  readonly ac?: Range;
  readonly abilities?: AbilityRangeMap;
  readonly folder?: FolderReference;
  readonly pagination: PaginationParams;
}
