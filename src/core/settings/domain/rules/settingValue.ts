import { InvalidSettingValueError } from '@/core/settings/domain/errors/settingErrors';
import type { SettingDefinition, SettingValueType } from '@/core/settings/domain/model/Setting';

function matchesType(valueType: SettingValueType, value: unknown): boolean {
  switch (valueType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'unknown':
      return true;
  }
}

function article(valueType: SettingValueType): string {
  return valueType === 'array' || valueType === 'object' ? `an ${valueType}` : `a ${valueType}`;
}

/**
 * The checks the API makes before handing a value to the core. The core casts
 * a plainly typed setting (`type: Boolean`, `Number`, …) without validating it
 * — `"false"` would become `true` — and clamps a number into its range without
 * a word (and rounds it to its step), so type, choices and range are checked
 * here for every setting; the core then validates a field- or model-typed
 * value in depth.
 */
export function checkSettingValue(definition: SettingDefinition, value: unknown): void {
  const refuse = (reason: string): never => {
    throw new InvalidSettingValueError(definition.id, reason);
  };

  if (value === null) {
    if (!definition.acceptsNull) {
      refuse('may not be null');
    }
    return;
  }
  if (!matchesType(definition.valueType, value)) {
    refuse(`expected ${article(definition.valueType)}`);
  }

  const { choices, range } = definition;
  if (choices !== null && choices.length > 0 && !choices.some((choice) => choice.value === value)) {
    refuse(`must be one of ${choices.map((choice) => JSON.stringify(choice.value)).join(', ')}`);
  }
  if (range !== null && typeof value === 'number') {
    if (range.min !== null && value < range.min) {
      refuse(`must be at least ${String(range.min)}`);
    }
    if (range.max !== null && value > range.max) {
      refuse(`must be at most ${String(range.max)}`);
    }
    if (range.step !== null && range.step > 0 && !isIncrement(value, range.step, range.min ?? 0)) {
      refuse(`must be an increment of ${String(range.step)}${range.min !== null && range.min !== 0 ? ` from ${String(range.min)}` : ''}`);
    }
  }
}

function isIncrement(value: number, step: number, base: number): boolean {
  const steps = (value - base) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/** Both sides come from the same serializer, so equal values print the same. */
export function sameSettingValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
