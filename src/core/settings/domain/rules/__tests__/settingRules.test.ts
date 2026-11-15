import {
  CredentialSettingError,
  InvalidSettingValueError,
  ProtectedSettingNamespaceError,
  ReadOnlySettingError,
  checkSettingValue,
  findCredentialPath,
  looksLikeCredential,
  requireAddressableSetting,
  requireReadableValue,
  requireWritableValue,
  sameSettingValue,
  settingAccess,
  type SettingDefinition
} from '../..';

function definition(overrides: Partial<SettingDefinition> = {}): SettingDefinition {
  return {
    id: 'core.fontSize',
    namespace: 'core',
    key: 'fontSize',
    name: 'Font Size',
    hint: null,
    scope: 'client',
    config: true,
    valueType: 'number',
    choices: null,
    range: null,
    acceptsNull: false,
    requiresReload: false,
    defaultValue: 5,
    ...overrides
  };
}

describe('looksLikeCredential', () => {
  it.each(['apiKey', 'api-key', 'API_KEY', 'openaiApiKey', 'clientSecret', 'password', 'turnPassword', 'credentials', 'accessToken', 'auth_token', 'auth.token', 'privateKey', 'passwd'])(
    'flags %s',
    (name) => {
      expect(looksLikeCredential(name)).toBe(true);
    }
  );

  it.each(['token', 'tokenDragPreview', 'tokenAutoRotate', 'defaultToken', 'keybindings', 'fontSize', 'apiUrl'])(
    'leaves %s alone',
    (name) => {
      expect(looksLikeCredential(name)).toBe(false);
    }
  );
});

describe('findCredentialPath', () => {
  it('finds a nested credential field by name', () => {
    expect(findCredentialPath({ mode: 0, turn: { url: '', password: '' } })).toBe('turn.password');
  });

  it('looks into arrays', () => {
    expect(findCredentialPath({ servers: [{ host: 'a' }, { host: 'b', apiKey: 'x' }] })).toBe('servers[1].apiKey');
  });

  it('inspects names only, never the strings themselves', () => {
    expect(findCredentialPath({ note: 'my password is hunter2' })).toBeNull();
    expect(findCredentialPath('password')).toBeNull();
    expect(findCredentialPath(null)).toBeNull();
  });
});

describe('requireAddressableSetting', () => {
  it("refuses the module's own namespace", () => {
    expect(() => requireAddressableSetting('foundry-api-bridge', 'wsUrl', 'foundry-api-bridge')).toThrow(
      "The settings of 'foundry-api-bridge' belong to the API bridge itself and cannot be read or changed through the API"
    );
    expect(() => requireAddressableSetting('foundry-api-bridge', 'anything', 'foundry-api-bridge')).toThrow(
      ProtectedSettingNamespaceError
    );
  });

  it('refuses a credential-like key', () => {
    expect(() => requireAddressableSetting('my-module', 'openAiApiKey', 'foundry-api-bridge')).toThrow(
      'Setting my-module.openAiApiKey looks like a credential and cannot be read or changed through the API'
    );
  });

  it('lets an ordinary setting through', () => {
    expect(() => requireAddressableSetting('core', 'tokenDragPreview', 'foundry-api-bridge')).not.toThrow();
  });
});

describe('settingAccess', () => {
  it('is read-write for an ordinary setting', () => {
    expect(settingAccess(definition())).toBe('read-write');
  });

  it('is read-only for the world permission table', () => {
    expect(settingAccess(definition({ id: 'core.permissions', key: 'permissions', valueType: 'object' }))).toBe('read-only');
  });

  it('is none for a credential-like key or a default with a credential field', () => {
    expect(settingAccess(definition({ id: 'm.secretKey', key: 'secretKey' }))).toBe('none');
    expect(
      settingAccess(definition({ id: 'core.rtcWorldSettings', key: 'rtcWorldSettings', defaultValue: { turn: { password: '' } } }))
    ).toBe('none');
  });
});

describe('requireReadableValue / requireWritableValue', () => {
  const rtc = definition({ id: 'core.rtcWorldSettings', key: 'rtcWorldSettings', valueType: 'object', defaultValue: { turn: { password: '' } } });

  it('refuses a setting whose default reveals a credential field', () => {
    expect(() => requireReadableValue(rtc, { turn: { password: 'x' } })).toThrow(
      'Setting core.rtcWorldSettings holds a credential (turn.password) and cannot be read or changed through the API'
    );
  });

  it('refuses a setting whose stored value holds a credential field', () => {
    const plain = definition({ valueType: 'object', defaultValue: {} });
    expect(() => requireReadableValue(plain, { auth: { accessToken: 'x' } })).toThrow(CredentialSettingError);
  });

  it('refuses writing to the permission table', () => {
    const permissions = definition({ id: 'core.permissions', key: 'permissions', valueType: 'object', defaultValue: {} });
    expect(() => requireWritableValue(permissions, {}, {})).toThrow('Setting core.permissions is read-only through the API');
    expect(() => requireReadableValue(permissions, { ACTOR_CREATE: [3, 4] })).not.toThrow();
  });

  it('refuses writing a credential field into a setting', () => {
    expect(() => requireWritableValue(definition({ valueType: 'object', defaultValue: {} }), {}, { password: 'x' })).toThrow(
      CredentialSettingError
    );
  });

  it('lets an ordinary write through', () => {
    expect(() => requireWritableValue(definition(), 5, 6)).not.toThrow();
  });

  it('keeps the read-only error for a refused write distinct', () => {
    const permissions = definition({ id: 'core.permissions', key: 'permissions', defaultValue: {} });
    expect(() => requireWritableValue(permissions, {}, {})).toThrow(ReadOnlySettingError);
  });
});

describe('checkSettingValue', () => {
  const refused = (def: SettingDefinition, value: unknown): string => {
    try {
      checkSettingValue(def, value);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSettingValueError);
      return (error as Error).message;
    }
    throw new Error('expected a refusal');
  };

  it.each([
    ['string', 'x', 5],
    ['number', 5, '5'],
    ['boolean', true, 'false'],
    ['array', [1], { 0: 1 }],
    ['object', { a: 1 }, [1]]
  ] as const)('checks the %s type', (valueType, good, bad) => {
    const def = definition({ id: 'm.k', valueType, defaultValue: good });
    expect(() => checkSettingValue(def, good)).not.toThrow();
    expect(refused(def, bad)).toMatch(/^Invalid value for setting m\.k: expected an? /);
  });

  it('refuses a non-finite number', () => {
    expect(refused(definition(), Number.NaN)).toBe('Invalid value for setting core.fontSize: expected a number');
  });

  it('accepts anything for an unknown type', () => {
    expect(() => checkSettingValue(definition({ valueType: 'unknown' }), { any: ['thing'] })).not.toThrow();
  });

  it('accepts null only where the setting can hold it', () => {
    expect(refused(definition(), null)).toBe('Invalid value for setting core.fontSize: may not be null');
    expect(() => checkSettingValue(definition({ acceptsNull: true }), null)).not.toThrow();
  });

  it('requires one of the choices', () => {
    const def = definition({
      valueType: 'string',
      choices: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' }
      ]
    });
    expect(() => checkSettingValue(def, 'b')).not.toThrow();
    expect(refused(def, 'c')).toBe('Invalid value for setting core.fontSize: must be one of "a", "b"');
  });

  it('compares numeric choices as numbers', () => {
    const def = definition({ choices: [{ value: 0, label: 'Zero' }, { value: 1, label: 'One' }] });
    expect(() => checkSettingValue(def, 1)).not.toThrow();
    expect(refused(def, 2)).toContain('must be one of 0, 1');
  });

  it('refuses a number outside the range instead of letting the core clamp it', () => {
    const def = definition({ range: { min: 0, max: 100, step: null } });
    expect(refused(def, -1)).toContain('must be at least 0');
    expect(refused(def, 500)).toContain('must be at most 100');
    expect(() => checkSettingValue(def, 100)).not.toThrow();
  });

  it('refuses a number off the step instead of letting the core round it', () => {
    expect(refused(definition({ range: { min: 0, max: 100, step: 10 } }), 15)).toContain('must be an increment of 10');
    expect(refused(definition({ range: { min: 1, max: null, step: 1 } }), 1.5)).toContain('must be an increment of 1 from 1');
    expect(() => checkSettingValue(definition({ range: { min: 0, max: 1, step: 0.1 } }), 0.3)).not.toThrow();
  });
});

describe('sameSettingValue', () => {
  it('compares plain JSON', () => {
    expect(sameSettingValue({ a: [1] }, { a: [1] })).toBe(true);
    expect(sameSettingValue(1, '1')).toBe(false);
  });
});
