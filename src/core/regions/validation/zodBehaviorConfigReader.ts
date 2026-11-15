import type { ZodError } from 'zod';
import { ValidationError, formatZodError } from '@/kernel';
import {
  CORE_BEHAVIOR_TYPES,
  type BehaviorConfigReader,
  type CoreBehaviorConfigInput,
  type CoreBehaviorType,
  type RegionBehaviorConfigInput
} from '@/core/regions/domain';
import { coreBehaviorConfigSchemas } from './behaviorConfigSchemas';

function isCoreType(type: string): type is CoreBehaviorType {
  return (CORE_BEHAVIOR_TYPES as readonly string[]).includes(type);
}

function configError(error: ZodError): ValidationError {
  const detail = formatZodError(error);
  return new ValidationError(error.issues[0]?.path.length ? `config.${detail}` : `config: ${detail}`);
}

function readCore(kind: CoreBehaviorType, config: Readonly<Record<string, unknown>>): CoreBehaviorConfigInput {
  const parsed = coreBehaviorConfigSchemas[kind].safeParse(config);
  if (!parsed.success) {
    throw configError(parsed.error);
  }
  // The schema table is keyed by kind, so the settings match it; TS cannot correlate the two.
  return { kind, settings: parsed.data } as CoreBehaviorConfigInput;
}

/** Core types are read field by field; any other type keeps the caller's object for the core to validate. */
export const zodBehaviorConfigReader: BehaviorConfigReader = {
  read(type: string, config: Readonly<Record<string, unknown>>): RegionBehaviorConfigInput {
    return isCoreType(type) ? readCore(type, config) : { kind: 'opaque', data: { ...config } };
  }
};
