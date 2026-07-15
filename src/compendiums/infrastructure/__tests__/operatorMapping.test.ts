import { toFoundryOperator } from '../operatorMapping';

// The lowercase literals are Foundry's SearchFilter.OPERATORS *values*
// (verified against installed v13 and v14 cores). evaluateFilter switches on
// these values; anything else silently degrades to strict equality.
describe('toFoundryOperator', () => {
  it.each([
    ['EQUALS', 'equals'],
    ['CONTAINS', 'contains'],
    ['STARTS_WITH', 'starts_with'],
    ['ENDS_WITH', 'ends_with'],
    ['LESS_THAN', 'lt'],
    ['LESS_THAN_EQUAL', 'lte'],
    ['GREATER_THAN', 'gt'],
    ['GREATER_THAN_EQUAL', 'gte'],
    ['BETWEEN', 'between'],
    ['IS_EMPTY', 'is_empty']
  ] as const)('maps %s to the foundry value %s', (wire, foundry) => {
    expect(toFoundryOperator(wire)).toBe(foundry);
  });
});
