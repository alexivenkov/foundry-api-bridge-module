import { readFileSync } from 'fs';
import { join } from 'path';

// The compiler checks that every command has params and a result type, but not
// that a handler is registered for it: an unregistered command only shows up at
// run time as "Unknown command type". This reads the sources to close that gap.

const SRC = join(__dirname, '..', '..');

function declaredCommandTypes(): string[] {
  const source = readFileSync(join(SRC, 'commands', 'types.ts'), 'utf8');
  const start = source.indexOf('export type CommandType =');
  const end = source.indexOf(';', start);
  const union = source.slice(start, end);

  return [...union.matchAll(/^\s*\|\s*'([^']+)'/gm)].map((match) => match[1] ?? '');
}

function registeredCommandTypes(): string[] {
  const source = readFileSync(join(SRC, 'main.ts'), 'utf8');

  return [...source.matchAll(/commandRouter\.register\(\s*'([^']+)'/g)].map((match) => match[1] ?? '');
}

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

describe('command registration', () => {
  const declared = declaredCommandTypes();
  const registered = registeredCommandTypes();

  it('finds the command list in the sources', () => {
    expect(declared.length).toBeGreaterThan(100);
    expect(registered.length).toBeGreaterThan(100);
  });

  it('declares every command type once', () => {
    expect(duplicates(declared)).toEqual([]);
  });

  it('registers every handler once', () => {
    expect(duplicates(registered)).toEqual([]);
  });

  it('registers a handler for every declared command type', () => {
    expect(declared.filter((type) => !registered.includes(type))).toEqual([]);
  });

  it('registers no command type that is not declared', () => {
    expect(registered.filter((type) => !declared.includes(type))).toEqual([]);
  });
});
