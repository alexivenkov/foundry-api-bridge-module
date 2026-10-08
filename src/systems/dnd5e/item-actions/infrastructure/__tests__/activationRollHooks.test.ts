import { ActivationRollHooks, SUBSEQUENT_ROLL_WAIT_MS } from '../activationRollHooks';
import type { ActivateItemOptions } from '@/systems/dnd5e/item-actions/domain';
import type { FoundryHooks, FoundryItem } from '../foundryItemActionTypes';

type Cb = (...args: unknown[]) => unknown;
const listeners = new Map<number, { hook: string; cb: Cb }>();
let next = 1;
const hooks: FoundryHooks = {
  on: jest.fn((hook: string, cb: Cb) => {
    listeners.set(next, { hook, cb });
    return next++;
  }),
  once: jest.fn(),
  off: jest.fn((_hook: string, id: number) => {
    listeners.delete(id);
  })
};
function fire(hook: string, ...args: unknown[]): void {
  for (const l of [...listeners.values()]) {
    if (l.hook === hook) l.cb(...args);
  }
}

const item = { id: 'potion-1', name: 'Potion', type: 'consumable', system: {} } as unknown as FoundryItem;

const base: ActivateItemOptions = {
  activityId: undefined,
  activityType: undefined,
  templatePosition: undefined,
  spellLevel: undefined,
  attackerTokenId: undefined,
  attackMode: undefined,
  ammunition: undefined,
  consume: undefined,
  fastForward: true,
  advantage: false,
  disadvantage: false,
  attackBonus: undefined,
  damageBonus: undefined,
  targetAcBonus: undefined
};

function armed(options: Partial<ActivateItemOptions> = {}, activityId: string | undefined = 'act-1'): ActivationRollHooks {
  const h = new ActivationRollHooks(hooks, item, activityId, { ...base, ...options });
  h.arm();
  return h;
}

beforeEach(() => {
  jest.clearAllMocks();
  listeners.clear();
  next = 1;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ActivationRollHooks', () => {
  it('carries attack mode, ammunition, advantage and a bonus into the attack config and skips the dialog', () => {
    armed({ attackMode: 'thrown', ammunition: 'arrow-1', advantage: true, attackBonus: '1d4' });
    const config = { subject: { id: 'act-1' }, rolls: [{ parts: ['@mod'], options: { attackMode: 'oneHanded' } }] };
    const dialog = { configure: true };

    fire('dnd5e.preRollAttackV2', config, dialog);

    expect(config).toEqual({
      subject: { id: 'act-1' },
      attackMode: 'thrown',
      ammunition: 'arrow-1',
      advantage: true,
      rolls: [{ parts: ['@mod', '1d4'], options: { attackMode: 'thrown', ammunition: 'arrow-1' } }]
    });
    expect(dialog.configure).toBe(false);
  });

  it('ignores rolls of other activities and leaves the dialog alone without fastForward', () => {
    const h = armed({ attackMode: 'twoHanded', fastForward: false });
    const other = { subject: { id: 'act-2' }, rolls: [{ parts: [] }] };
    const ours: { subject: { _id: string }; rolls: Array<{ parts: string[]; options?: Record<string, unknown> }> } = { subject: { _id: 'act-1' }, rolls: [{ parts: [] }] };
    const dialog = { configure: true };

    fire('dnd5e.preRollAttackV2', other, dialog);
    expect(other).toEqual({ subject: { id: 'act-2' }, rolls: [{ parts: [] }] });

    fire('dnd5e.preRollAttackV2', ours, dialog);
    expect(ours.rolls[0]?.options).toEqual({ attackMode: 'twoHanded' });
    expect(dialog.configure).toBe(true);
    h.dispose();
  });

  it('turns consume.ammunition=false into an attack without ammunition, and disadvantage into the flag', () => {
    armed({ consume: { ammunition: false }, disadvantage: true });
    const config = { subject: { id: 'act-1' }, rolls: [{}] };

    fire('dnd5e.preRollAttackV2', config, {});

    expect(config).toEqual({ subject: { id: 'act-1' }, ammunition: false, disadvantage: true, rolls: [{ options: { ammunition: false } }] });
  });

  it('adds the damage bonus to the first damage part', () => {
    armed({ damageBonus: '1d6' });
    const config = { subject: { id: 'act-1' }, rolls: [{ parts: ['1d8'] }, { parts: ['1d4'] }] };
    const dialog = {};

    fire('dnd5e.preRollDamageV2', config, dialog);

    expect(config.rolls).toEqual([{ parts: ['1d8', '1d6'] }, { parts: ['1d4'] }]);
    expect(dialog).toEqual({ configure: false });
  });

  it('collects attack and damage rolls of this activation and resolves waiters', async () => {
    const h = armed();
    const waited = h.waitForAttack(SUBSEQUENT_ROLL_WAIT_MS);
    const attack = { total: 17, formula: '1d20 + 5', terms: [] };
    const damage = { total: 6, formula: '1d8', terms: [] };

    fire('dnd5e.rollAttackV2', [attack], { subject: { id: 'other' } });
    fire('dnd5e.rollAttackV2', [attack], { subject: { id: 'act-1' } });
    fire('dnd5e.rollDamageV2', [damage], { subject: { id: 'act-1' } });

    expect(await waited).toBe(true);
    expect(h.attackRolls).toEqual([attack]);
    expect(h.damageRolls).toEqual([damage]);
    expect(await h.waitForDamage(1)).toBe(true);
  });

  it('accepts the first roll when no activity was resolved (item.use fallback)', () => {
    const h = new ActivationRollHooks(hooks, item, undefined, base);
    h.arm();
    fire('dnd5e.rollDamageV2', [{ total: 3, formula: '1d4', terms: [] }]);
    expect(h.damageRolls).toHaveLength(1);
  });

  it('resolves waiters with false on timeout and on dispose', async () => {
    const h = armed();
    const timedOut = h.waitForAttack(1000);
    jest.advanceTimersByTime(1000);
    expect(await timedOut).toBe(false);

    const pending = h.waitForDamage(SUBSEQUENT_ROLL_WAIT_MS);
    h.dispose();
    expect(await pending).toBe(false);
    expect(listeners.size).toBe(0);
  });

  it('keeps an auto-destroy consumable at quantity 0 instead of letting dnd5e delete it mid-workflow', () => {
    const h = armed();
    const updates = { delete: ['potion-1', 'other'], item: [{ _id: 'potion-1', 'system.uses.spent': 1 }] };

    fire('dnd5e.activityConsumption', { id: 'act-1' }, {}, {}, updates);

    expect(updates).toEqual({ delete: ['other'], item: [{ _id: 'potion-1', 'system.uses.spent': 1, 'system.quantity': 0 }] });
    expect(h.deferredDelete).toBe(true);

    const untouched = { delete: ['something-else'] };
    fire('dnd5e.activityConsumption', { id: 'act-1' }, {}, {}, untouched);
    expect(untouched).toEqual({ delete: ['something-else'] });
  });

  it('raises every target\'s AC for the Midi hit check only when a bonus is given', () => {
    armed({ targetAcBonus: 2 });
    const modifiers = new Map<string, number>([['Actor.b', 1]]);
    const workflow = {
      activity: { id: 'act-1' },
      targets: new Set([{ actor: { uuid: 'Actor.a' } }, { actor: { uuid: 'Actor.b' } }, { actor: null }]),
      targetACModifiers: modifiers
    };

    fire('midi-qol.preCheckHits', workflow);

    expect([...modifiers.entries()]).toEqual([['Actor.b', 3], ['Actor.a', 2]]);
    expect([...listeners.values()].some((l) => l.hook === 'midi-qol.preCheckHits')).toBe(true);

    listeners.clear();
    armed();
    expect([...listeners.values()].some((l) => l.hook === 'midi-qol.preCheckHits')).toBe(false);
  });

  it('self-disposes after its lifetime', () => {
    armed();
    expect(listeners.size).toBeGreaterThan(0);
    jest.advanceTimersByTime(120000);
    expect(listeners.size).toBe(0);
  });
});
