import type { PackFieldOperator } from '@/compendiums/domain';

// Foundry's SearchFilter.evaluateFilter switches on the lowercase OPERATOR
// *values*, not the uppercase constant names; an unknown operator silently
// falls back to strict equality. Values verified against installed Foundry
// v13 and v14 cores (client/applications/ux/search-filter.mjs).
const OPERATOR_TO_FOUNDRY: Readonly<Record<PackFieldOperator, string>> = {
  EQUALS: 'equals',
  CONTAINS: 'contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  LESS_THAN: 'lt',
  LESS_THAN_EQUAL: 'lte',
  GREATER_THAN: 'gt',
  GREATER_THAN_EQUAL: 'gte',
  BETWEEN: 'between',
  IS_EMPTY: 'is_empty'
};

export function toFoundryOperator(operator: PackFieldOperator): string {
  return OPERATOR_TO_FOUNDRY[operator];
}
