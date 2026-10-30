import { maxOf, makeGame, type FakeGameOptions } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

export const d10Queue: number[][] = [];
export const formulaTotals: Record<string, number> = {};

interface FakeDieTerm {
  faces: number;
  number: number;
  results: { result: number; active: boolean }[];
  total: number;
}

/** A stand-in for Foundry's `Roll`: `Nd10` pulls faces from `d10Queue`, other formulas use `formulaTotals` or their maximum. */
export class FakeRoll {
  formula: string;
  total = 0;
  dice: FakeDieTerm[] = [];

  constructor(formula: string) {
    this.formula = formula;
  }

  async evaluate(options: { maximize?: boolean } = {}): Promise<this> {
    const d10 = /^(\d+)d10$/.exec(this.formula);
    if (d10) {
      const count = Number(d10[1]);
      const results = d10Queue.shift() ?? Array.from({ length: count }, () => 5);
      const total = results.reduce((sum, r) => sum + r, 0);
      this.total = total;
      this.dice = [{ faces: 10, number: count, results: results.map((result) => ({ result, active: true })), total }];
    } else {
      const total = options.maximize === true ? maxOf(this.formula) : (formulaTotals[this.formula] ?? maxOf(this.formula));
      this.total = total;
      this.dice = [{ faces: 6, number: 1, results: [{ result: total, active: true }], total }];
    }
    return Promise.resolve(this);
  }

  async toMessage(): Promise<{ id: string }> {
    return Promise.resolve({ id: 'roll-msg' });
  }
}

export interface Coc7WorldOptions extends FakeGameOptions {
  systemId?: string;
}

/** Installs the `game` and `Roll` globals of a CoC7 world; returns the mutable system block for guard tests. */
export function installCoc7World(options: Coc7WorldOptions = {}): { system: { id: string } } {
  const system = { id: options.systemId ?? 'CoC7' };
  const game = { ...makeGame(options), system };
  (globalThis as Record<string, unknown>)['game'] = game;
  (globalThis as Record<string, unknown>)['Roll'] = FakeRoll;
  d10Queue.length = 0;
  for (const key of Object.keys(formulaTotals)) {
    delete formulaTotals[key];
  }
  return { system };
}

export function queueCheck(tens: number[], unit: number): void {
  d10Queue.push(tens, [unit]);
}

export function uninstallCoc7World(): void {
  delete (globalThis as Record<string, unknown>)['game'];
  delete (globalThis as Record<string, unknown>)['Roll'];
  delete (globalThis as Record<string, unknown>)['fromUuid'];
}
