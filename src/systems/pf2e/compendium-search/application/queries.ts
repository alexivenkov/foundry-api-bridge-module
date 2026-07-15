import type { EnumSet, PaginationParams, Range, SubstringQuery } from '@/kernel';

// Pack targeting (packIds) lives on the repositories, not in the queries.

export interface Pf2eFilterCompendiumActorsQuery {
  readonly name?: SubstringQuery;
  readonly types?: EnumSet<string>;
  readonly level?: Range;
  readonly traits?: readonly string[];
  readonly rarities?: EnumSet<string>;
  readonly sizes?: EnumSet<string>;
  readonly maxHp?: Range;
  readonly ac?: Range;
  readonly pagination: PaginationParams;
}

export interface Pf2eFilterCompendiumItemsQuery {
  readonly name?: SubstringQuery;
  readonly types?: EnumSet<string>;
  readonly level?: Range;
  readonly traits?: readonly string[];
  readonly rarities?: EnumSet<string>;
  readonly categories?: EnumSet<string>;
  readonly traditions?: EnumSet<string>;
  readonly priceGold?: Range;
  readonly pagination: PaginationParams;
}
