import { requirePf1 } from '../requirePf1';

type Globals = Record<string, unknown>;

function world(systemId: string, version: string | undefined, generation: number | undefined): void {
  (globalThis as Globals)['game'] = {
    system: { id: systemId, ...(version !== undefined ? { version } : {}) },
    ...(generation !== undefined ? { release: { generation } } : {})
  };
}

describe('requirePf1', () => {
  afterEach(() => {
    delete (globalThis as Globals)['game'];
  });

  it('accepts pf1 11.x on Foundry 12 and 13', () => {
    world('pf1', '11.11', 13);
    expect(() => requirePf1('pf1/roll-skill')).not.toThrow();
    world('pf1', '11.0', 12);
    expect(() => requirePf1('pf1/roll-skill')).not.toThrow();
  });

  it('refuses another system first', () => {
    world('pf2e', '7.0', 13);
    expect(() => requirePf1('pf1/roll-skill')).toThrow("Operation 'pf1/roll-skill' is not supported by game system 'pf2e'");
  });

  it('refuses pf1 12 and any pf1 on Foundry 14 (development builds still report 11.x)', () => {
    world('pf1', '12.0', 14);
    expect(() => requirePf1('pf1/roll-save')).toThrow('pf1/roll-save supports pf1 11.x on Foundry 12–13; this world runs pf1 12.0 on Foundry 14');
    world('pf1', '11.11', 14);
    expect(() => requirePf1('pf1/roll-save')).toThrow('this world runs pf1 11.11 on Foundry 14');
  });

  it('does not guess when the version is unknown', () => {
    world('pf1', undefined, undefined);
    expect(() => requirePf1('pf1/use-item')).not.toThrow();
  });
});
