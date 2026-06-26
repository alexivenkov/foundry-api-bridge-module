import { requireSystem } from '../requireSystem';
import { UnsupportedOperationError } from '../shared/domain/errors';

describe('requireSystem', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  it('passes when the world system matches', () => {
    (globalThis as Record<string, unknown>)['game'] = { system: { id: 'pf2e' } };
    expect(() => requireSystem('pf2e', 'pf2e/roll-skill')).not.toThrow();
  });

  it('throws UnsupportedOperationError when the world system differs', () => {
    (globalThis as Record<string, unknown>)['game'] = { system: { id: 'dnd5e' } };
    expect(() => requireSystem('pf2e', 'pf2e/roll-skill')).toThrow(UnsupportedOperationError);
    expect(() => requireSystem('pf2e', 'pf2e/roll-skill')).toThrow(
      "Operation 'pf2e/roll-skill' is not supported by game system 'dnd5e'"
    );
  });

  it('reports an empty world system id when game.system is absent', () => {
    (globalThis as Record<string, unknown>)['game'] = {};
    expect(() => requireSystem('dnd5e', 'dnd5e/roll-skill')).toThrow(
      "Operation 'dnd5e/roll-skill' is not supported by game system ''"
    );
  });
});
