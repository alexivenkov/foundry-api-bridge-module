import { DomainError, ValidationError } from '../../../../../kernel';
import {
  InvalidMacroArgumentsError,
  MacroActorNotFoundError,
  MacroCreationCancelledError,
  MacroExecutionFailedError,
  MacroNotFoundError,
  MacroSyntaxError,
  MacroTokenNotFoundError,
  ScriptMacrosDisabledError,
  describeThrown,
  isMacroArguments,
  requireScriptMacrosAllowed,
  type ScriptMacroPolicy
} from '../..';

function policy(allowed: boolean): ScriptMacroPolicy & { asked: number } {
  return {
    asked: 0,
    allowsScriptMacros(): boolean {
      this.asked += 1;
      return allowed;
    }
  };
}

describe('requireScriptMacrosAllowed', () => {
  it('lets a script macro through when the world allows them', () => {
    expect(() => {
      requireScriptMacrosAllowed('script', policy(true));
    }).not.toThrow();
  });

  it('refuses a script macro when the world does not', () => {
    const act = (): void => {
      requireScriptMacrosAllowed('script', policy(false));
    };

    expect(act).toThrow(ScriptMacrosDisabledError);
    expect(act).toThrow(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
  });

  it.each(['chat', undefined] as const)('never consults the policy for %s', (type) => {
    const forbidding = policy(false);

    requireScriptMacrosAllowed(type, forbidding);

    expect(forbidding.asked).toBe(0);
  });

  it('consults the policy on every check, so a changed setting is seen at once', () => {
    const allowing = policy(true);

    requireScriptMacrosAllowed('script', allowing);
    requireScriptMacrosAllowed('script', allowing);

    expect(allowing.asked).toBe(2);
  });
});

describe('isMacroArguments', () => {
  it.each([
    ['an empty object', {}],
    ['a nested object', { target: { id: 't1' }, list: [1, 2] }],
    ['an object without a prototype', Object.create(null)]
  ])('accepts %s', (_case, value) => {
    expect(isMacroArguments(value)).toBe(true);
  });

  it.each([
    ['an array', []],
    ['null', null],
    ['undefined', undefined],
    ['a string', 'x'],
    ['a number', 1],
    ['a boolean', true]
  ])('rejects %s', (_case, value) => {
    expect(isMacroArguments(value)).toBe(false);
  });
});

describe('describeThrown', () => {
  it('reads the message of an error', () => {
    expect(describeThrown(new TypeError('bad input'))).toBe('bad input');
  });

  it.each([
    ['a string', 'nope', 'nope'],
    ['a number', 42, '42'],
    ['undefined', undefined, 'undefined'],
    ['an object', { code: 1 }, '[object Object]']
  ])('stringifies %s', (_case, thrown, text) => {
    expect(describeThrown(thrown)).toBe(text);
  });
});

describe('macro errors carry the wire texts', () => {
  it.each([
    [new MacroNotFoundError('m1'), 'Macro not found: m1'],
    [
      new MacroCreationCancelledError(),
      'Macro creation was cancelled by Foundry (a module hook may have vetoed it)'
    ],
    [new InvalidMacroArgumentsError(), 'args must be a JSON object'],
    [new MacroSyntaxError('Broken', 'Unexpected token'), 'Macro "Broken" has a syntax error: Unexpected token'],
    [new MacroExecutionFailedError('Attack', 'boom'), 'Macro "Attack" failed: boom'],
    [new MacroActorNotFoundError('a1'), 'Actor not found: a1'],
    [new MacroTokenNotFoundError('t1'), 'Token not found on active scene: t1']
  ])('%s', (error, text) => {
    expect(error.message).toBe(text);
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it('counts bad arguments as a validation failure', () => {
    expect(new InvalidMacroArgumentsError()).toBeInstanceOf(ValidationError);
  });
});
