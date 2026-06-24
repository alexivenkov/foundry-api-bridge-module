import { Dnd5eMidiWorkflowGateway } from '../Dnd5eMidiWorkflowGateway';

const hooks = { once: jest.fn(), off: jest.fn() };
const modules = { get: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (globalThis as Record<string, unknown>)['game'] = { modules };
  (globalThis as Record<string, unknown>)['Hooks'] = hooks;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Dnd5eMidiWorkflowGateway', () => {
  it('reports active state from the midi-qol module', () => {
    modules.get.mockReturnValue({ active: true });
    expect(new Dnd5eMidiWorkflowGateway().isActive()).toBe(true);

    modules.get.mockReturnValue(undefined);
    expect(new Dnd5eMidiWorkflowGateway().isActive()).toBe(false);
  });

  it('captures and maps a workflow, then removes the hook', async () => {
    hooks.once.mockImplementation((_hook: string, cb: (wf: unknown) => void) => {
      cb({
        attackTotal: 18,
        damageTotal: 12,
        isCritical: false,
        isFumble: false,
        hitTargets: new Set([{ id: 't1' }]),
        saves: new Set(),
        failedSaves: new Set([{ id: 't2' }])
      });
      return 7;
    });

    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    const outcome = await capture.await();

    expect(hooks.once).toHaveBeenCalledWith('midi-qol.RollComplete', expect.any(Function));
    expect(outcome).toEqual({
      attackTotal: 18,
      damageTotal: 12,
      isCritical: false,
      isFumble: false,
      hitTargetIds: ['t1'],
      saveTargetIds: [],
      failedSaveTargetIds: ['t2']
    });
    expect(hooks.off).toHaveBeenCalledWith('midi-qol.RollComplete', 7);
  });

  it('clears the pending timeout once the workflow resolves (no lingering timer)', async () => {
    hooks.once.mockImplementation((_hook: string, cb: (wf: unknown) => void) => {
      cb({ hitTargets: new Set(), saves: new Set(), failedSaves: new Set() });
      return 1;
    });

    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    await capture.await();

    expect(jest.getTimerCount()).toBe(0);
  });

  it('resolves undefined and cleans up on timeout', async () => {
    hooks.once.mockReturnValue(42);

    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    const promise = capture.await();
    jest.advanceTimersByTime(30000);
    const outcome = await promise;

    expect(outcome).toBeUndefined();
    expect(hooks.off).toHaveBeenCalledWith('midi-qol.RollComplete', 42);
  });

  it('cancel() removes the hook without awaiting', () => {
    hooks.once.mockReturnValue(99);

    const capture = new Dnd5eMidiWorkflowGateway().captureNext();
    capture.cancel();

    expect(hooks.off).toHaveBeenCalledWith('midi-qol.RollComplete', 99);
  });
});
