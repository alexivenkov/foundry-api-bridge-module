// The context owns its operator vocabulary; the identically-named wire union
// in commands/types.ts is mapped onto this one at the validation boundary.
export type PackFieldOperator =
  | 'EQUALS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'LESS_THAN'
  | 'LESS_THAN_EQUAL'
  | 'GREATER_THAN'
  | 'GREATER_THAN_EQUAL'
  | 'BETWEEN'
  | 'IS_EMPTY';

export interface PackFieldFilter {
  readonly field: string;
  readonly operator: PackFieldOperator;
  readonly value?: unknown;
  readonly negate: boolean;
}

export interface PackSearchCriteria {
  readonly query?: string;
  readonly filters?: readonly PackFieldFilter[];
  readonly exclude?: readonly string[];
  readonly fields?: readonly string[];
}
