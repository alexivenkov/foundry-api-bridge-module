import { Dnd5eMidiWorkflowGateway, MIDI_WORKFLOW_TIMEOUT, toMidiWorkflowOutcome } from '../Dnd5eMidiWorkflowGateway';

type Listener = { hook: string; cb: (...args: unknown[]) => unknown };
const listeners = new Map<number, Listener>();
let nextId = 1;
const hooks = {
  on: jest.fn((hook: string, cb: (...args: unknown[]) => unknown) => {
    listeners.set(nextId, { hook, cb });
    return nextId++;
  }),
  once: jest.fn((hook: string, cb: (...args: unknown[]) => unknown) => {
    listeners.set(nextId, { hook, cb });
    return nextId++;
  }),
  off: jest.fn((_hook: string, id: number) => {
    listeners.delete(id);
  })
};
function fire(hook: string, ...args: unknown[]): void {
  for (const l of [...listeners.values()]) {
    if (l.hook === hook) l.cb(...args);
  }
}
const modules = { get: jest.fn() };
const fromUuidSync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  listeners.clear();
  nextId = 1;
  jest.useFakeTimers();
  (globalThis as Record<string, unknown>)['game'] = { modules };
  (globalThis as Record<string, unknown>)['Hooks'] = hooks;
  (globalThis as Record<string, unknown>)['fromUuidSync'] = fromUuidSync;
});

afterEach(() => {
  jest.useRealTimers();
});

const baseWorkflow = {
  attackTotal: 18,
  damageTotal: 12,
  isCritical: false,
  isFumble: false,
  hitTargets: new Set([{ id: 't1' }]),
  saves: new Set<{ id: string }>(),
  failedSaves: new Set([{ id: 't2' }])
};

describe('Dnd5eMidiWorkflowGateway', () => {
  it('reports active state from the midi-qol module', () => {
    modules.get.mockReturnValue({ active: true });
    expect(new Dnd5eMidiWorkflowGateway().isActive()).toBe(true);

    modules.get.mockReturnValue(undefined);
    expect(new Dnd5eMidiWorkflowGateway().isActive()).toBe(false);
  });

  it('completes with the mapped workflow and removes every hook', async () => {
    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    fire('midi-qol.RollComplete', baseWorkflow);
    const result = await capture.await();

    expect(hooks.once).toHaveBeenCalledWith('midi-qol.RollComplete', expect.any(Function));
    expect(hooks.on).toHaveBeenCalledWith('deleteChatMessage', expect.any(Function));
    expect(result).toEqual({
      kind: 'completed',
      workflow: {
        attackTotal: 18,
        damageTotal: 12,
        isCritical: false,
        isFumble: false,
        hitTargetIds: ['t1'],
        saveTargetIds: [],
        failedSaveTargetIds: ['t2']
      }
    });
    expect(listeners.size).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('times out below the platform gate', async () => {
    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    const promise = capture.await();
    jest.advanceTimersByTime(MIDI_WORKFLOW_TIMEOUT);

    expect(await promise).toEqual({ kind: 'timeout' });
    expect(MIDI_WORKFLOW_TIMEOUT).toBeLessThan(30000);
    expect(listeners.size).toBe(0);
  });

  it('reports an abort when the tracked usage card is deleted, ignoring other messages', async () => {
    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    capture.trackCard('card-1');
    const promise = capture.await();
    fire('deleteChatMessage', { id: 'other' });
    fire('deleteChatMessage', { id: 'card-1' });

    expect(await promise).toEqual({ kind: 'aborted' });
  });

  it('cancel() removes the hooks and the timer without awaiting', () => {
    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    capture.cancel();

    expect(listeners.size).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('splits the damage list into applied damage and healing per token, checking the actor now', () => {
    fromUuidSync.mockImplementation((uuid: string) => {
      if (uuid === 'Scene.s.Token.gob1') return { actor: { system: { attributes: { hp: { value: 2, max: 7, temp: 0 } } } } };
      if (uuid === 'Scene.s.Token.pc1') return { actor: { system: { attributes: { hp: { value: 15, max: 20, temp: 0 } } } } };
      if (uuid === 'Scene.s.Token.gob2') return { actor: { system: { attributes: { hp: { value: 7, max: 7, temp: 0 } } } } };
      return null;
    });
    const outcome = toMidiWorkflowOutcome({
      ...baseWorkflow,
      damageList: [
        { targetUuid: 'Scene.s.Token.gob1', oldHP: 7, newHP: 2, oldTempHP: 0, newTempHP: 0, hpDamage: 5, wasHit: true },
        { targetUuid: 'Scene.s.Token.pc1', oldHP: 9, newHP: 15, oldTempHP: 0, newTempHP: 0, hpDamage: -6 },
        { targetUuid: 'Scene.s.Token.gob2', oldHP: 7, newHP: 4, hpDamage: 3, wasHit: true },
        { actorId: 'loose', oldHP: 3, newHP: 3 }
      ]
    });

    expect(outcome.appliedDamage).toEqual({
      gob1: { applied: true, hpBefore: 7, hpAfter: 2, tempBefore: 0, tempAfter: 0 },
      gob2: { applied: false, hpBefore: 7, hpAfter: 4 },
      loose: { applied: true, hpBefore: 3, hpAfter: 3 }
    });
    expect(outcome.appliedHealing).toEqual({
      pc1: { applied: true, hpBefore: 9, hpAfter: 15, tempBefore: 0, tempAfter: 0 }
    });
  });
});
