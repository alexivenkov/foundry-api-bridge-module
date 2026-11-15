import type { FoundrySettingsGlobals } from './foundrySettingTypes';

// Internal markers the core prints into validation messages, e.g. `SchemaField#_validateRecursive`.
const INTERNAL_MARKER = /\b[A-Z]\w*#_?\w+\b/g;

/**
 * The readable text of what the core threw. Foundry 13 throws a
 * `DataModelValidationError` whose message lists the failures; Foundry 14
 * throws the bare `DataModelValidationFailure` (not an Error), whose own
 * string has them.
 */
export function coreErrorText(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lines = raw
    .split('\n')
    .map((line) => line.replace(INTERNAL_MARKER, '').trim())
    .filter((line) => line !== '');
  const text = lines.reduce((joined, line) => {
    if (joined === '') {
      return line;
    }
    return joined.endsWith(':') ? `${joined} ${line}` : `${joined}; ${line}`;
  }, '');
  return text === '' ? 'the core rejected it' : text;
}

export function isCoreValidationError(error: unknown, foundry: FoundrySettingsGlobals['foundry']): boolean {
  const validation = foundry.data.validation;
  if (validation === undefined || typeof error !== 'object' || error === null) {
    return false;
  }
  const { DataModelValidationError, DataModelValidationFailure } = validation;
  return (
    (DataModelValidationError !== undefined && error instanceof DataModelValidationError) ||
    (DataModelValidationFailure !== undefined && error instanceof DataModelValidationFailure)
  );
}
