import { InvalidSettingValueError, type SettingDefinition, type SettingRegistry } from '../../domain';

export function definition(overrides: Partial<SettingDefinition> = {}): SettingDefinition {
  const namespace = overrides.namespace ?? 'core';
  const key = overrides.key ?? 'fontSize';
  return {
    id: `${namespace}.${key}`,
    namespace,
    key,
    name: 'Font Size',
    hint: null,
    scope: 'client',
    config: true,
    valueType: 'number',
    choices: null,
    range: { min: 1, max: 10, step: 1 },
    acceptsNull: false,
    requiresReload: false,
    defaultValue: 5,
    ...overrides
  };
}

export class FakeSettingRegistry implements SettingRegistry {
  readonly writes: Array<{ id: string; value: unknown }> = [];
  rejectWith: string | null = null;
  private readonly values = new Map<string, unknown>();

  constructor(
    private readonly definitions: readonly SettingDefinition[],
    values: Readonly<Record<string, unknown>> = {}
  ) {
    for (const [id, value] of Object.entries(values)) {
      this.values.set(id, value);
    }
  }

  listDefinitions(): readonly SettingDefinition[] {
    return this.definitions;
  }

  findDefinition(namespace: string, key: string): SettingDefinition | null {
    return this.definitions.find((d) => d.namespace === namespace && d.key === key) ?? null;
  }

  readValue(definition: SettingDefinition): unknown {
    return this.values.has(definition.id) ? this.values.get(definition.id) : definition.defaultValue;
  }

  writeValue(definition: SettingDefinition, value: unknown): Promise<void> {
    if (this.rejectWith !== null) {
      return Promise.reject(new InvalidSettingValueError(definition.id, this.rejectWith));
    }
    this.writes.push({ id: definition.id, value });
    this.values.set(definition.id, value);
    return Promise.resolve();
  }
}
