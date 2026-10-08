import { Dnd5eItemActivationService } from '../Dnd5eItemActivationService';
import type {
  ActivationUseOutcome,
  DialogWatch,
  DialogWatchPort,
  ItemActivationPort,
  MidiCaptureResult,
  MidiWorkflowCapture,
  MidiWorkflowOutcome,
  MidiWorkflowPort,
  TargetingPort,
  UserDialogKind
} from '@/systems/dnd5e/item-actions/domain';
import type { ActivateItemCommand } from '../ItemActionCommands';

const used: ActivationUseOutcome = {
  itemId: 'i1',
  itemName: 'Sword',
  itemType: 'weapon',
  activityUsed: { id: 'act-1', name: 'Attack', type: 'attack' },
  rolls: [],
  chatMessageId: 'msg-1'
};

const workflow: MidiWorkflowOutcome = {
  attackTotal: 18,
  damageTotal: 12,
  isCritical: false,
  isFumble: false,
  hitTargetIds: ['t1'],
  saveTargetIds: [],
  failedSaveTargetIds: [],
  appliedDamage: { t1: { applied: true, hpBefore: 20, hpAfter: 8 } }
};

const baseCommand: ActivateItemCommand = {
  actorId: 'a1',
  itemId: 'i1',
  activityId: undefined,
  activityType: undefined,
  targetTokenIds: [],
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

function activationWith(outcome: ActivationUseOutcome | Promise<ActivationUseOutcome>): ItemActivationPort {
  return {
    describe: jest.fn(() => ({ itemId: 'i1', itemName: 'Sword', itemType: 'weapon' })),
    activate: jest.fn(async () => outcome)
  };
}

function captureWith(result: MidiCaptureResult | Promise<MidiCaptureResult>): MidiWorkflowCapture {
  return { await: jest.fn(async () => result), trackCard: jest.fn(), cancel: jest.fn() };
}

function midiWith(capture: MidiWorkflowCapture | undefined): MidiWorkflowPort {
  return {
    isActive: jest.fn(() => capture !== undefined),
    captureNext: jest.fn(() => {
      if (!capture) throw new Error('no capture');
      return capture;
    })
  };
}

/** A watch that never sees a dialog unless `open()` is called. */
function silentWatch(): DialogWatch & { open(kind: UserDialogKind): void } {
  let resolve: ((kind: UserDialogKind) => void) | undefined;
  const promise = new Promise<UserDialogKind>((r) => {
    resolve = r;
  });
  return { awaitDialog: jest.fn(() => promise), cancel: jest.fn(), open: (kind) => resolve?.(kind) };
}

function dialogsWith(watch: DialogWatch): DialogWatchPort {
  return { watch: jest.fn(() => watch) };
}

const targeting: TargetingPort = { setTargets: jest.fn((ids: readonly string[]) => ids.length) };

describe('Dnd5eItemActivationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets targets, arms Midi and the dialog watch before use, then awaits the capture', async () => {
    const order: string[] = [];
    const targetingSpy: TargetingPort = {
      setTargets: jest.fn((ids: readonly string[]) => {
        order.push('setTargets');
        return ids.length;
      })
    };
    const activation: ItemActivationPort = {
      describe: jest.fn(),
      activate: jest.fn(async () => {
        order.push('activate');
        return used;
      })
    };
    const capture: MidiWorkflowCapture = {
      await: jest.fn(async (): Promise<MidiCaptureResult> => {
        order.push('await');
        return { kind: 'completed', workflow };
      }),
      trackCard: jest.fn(),
      cancel: jest.fn()
    };
    const midi: MidiWorkflowPort = {
      isActive: jest.fn(() => true),
      captureNext: jest.fn(() => {
        order.push('captureNext');
        return capture;
      })
    };
    const watch = silentWatch();
    const dialogs: DialogWatchPort = {
      watch: jest.fn(() => {
        order.push('watch');
        return watch;
      })
    };

    const service = new Dnd5eItemActivationService(activation, targetingSpy, midi, dialogs);
    const outcome = await service.activate({ ...baseCommand, targetTokenIds: ['t1', 't2'] });

    expect(order).toEqual(['setTargets', 'captureNext', 'watch', 'activate', 'await']);
    expect(capture.trackCard).toHaveBeenCalledWith('msg-1');
    expect(outcome.status).toBe('completed');
    expect(outcome.activated).toBe(true);
    expect(outcome.targetsSet).toBe(2);
    expect(outcome.workflow).toBe(workflow);
    expect(outcome.appliedDamage).toEqual({ t1: { applied: true, hpBefore: 20, hpAfter: 8 } });
    expect(outcome.chatMessageId).toBe('msg-1');
    expect(watch.cancel).toHaveBeenCalled();
  });

  it('passes every option of the command to the activation port', async () => {
    const activation = activationWith(used);
    const service = new Dnd5eItemActivationService(activation, targeting, midiWith(undefined), dialogsWith(silentWatch()));

    await service.activate({
      ...baseCommand,
      attackerTokenId: 'tok',
      attackMode: 'thrown',
      ammunition: false,
      consume: { spellSlot: false },
      fastForward: false,
      advantage: true,
      attackBonus: '1d4',
      damageBonus: '1d6',
      targetAcBonus: 2
    });

    expect(activation.activate).toHaveBeenCalledWith('a1', 'i1', expect.objectContaining({
      attackerTokenId: 'tok',
      attackMode: 'thrown',
      ammunition: false,
      consume: { spellSlot: false },
      fastForward: false,
      advantage: true,
      disadvantage: false,
      attackBonus: '1d4',
      damageBonus: '1d6',
      targetAcBonus: 2
    }));
  });

  it('skips the Midi capture when inactive and keeps the gateway warning and healing', async () => {
    const vanilla: ActivationUseOutcome = { ...used, warning: 'no_roll_performed', appliedHealing: { t1: { applied: true, hpBefore: 1, hpAfter: 9 } } };
    const midi = midiWith(undefined);
    const service = new Dnd5eItemActivationService(activationWith(vanilla), targeting, midi, dialogsWith(silentWatch()));

    const outcome = await service.activate(baseCommand);

    expect(midi.captureNext).not.toHaveBeenCalled();
    expect(outcome.workflow).toBeUndefined();
    expect(outcome.warning).toBe('no_roll_performed');
    expect(outcome.appliedHealing).toEqual({ t1: { applied: true, hpBefore: 1, hpAfter: 9 } });
  });

  it('cancels the capture and the watch if activation throws', async () => {
    const activation: ItemActivationPort = {
      describe: jest.fn(),
      activate: jest.fn(async () => {
        throw new Error('boom');
      })
    };
    const capture = captureWith({ kind: 'timeout' });
    const watch = silentWatch();
    const service = new Dnd5eItemActivationService(activation, targeting, midiWith(capture), dialogsWith(watch));

    await expect(service.activate(baseCommand)).rejects.toThrow('boom');
    expect(capture.cancel).toHaveBeenCalled();
    expect(capture.await).not.toHaveBeenCalled();
    expect(watch.cancel).toHaveBeenCalled();
  });

  it('answers awaiting_user_dialog as soon as a dialog opens before the use resolves', async () => {
    let finishUse: ((o: ActivationUseOutcome) => void) | undefined;
    const pending = new Promise<ActivationUseOutcome>((resolve) => {
      finishUse = resolve;
    });
    const activation = activationWith(pending);
    const capture = captureWith({ kind: 'timeout' });
    const watch = silentWatch();
    const service = new Dnd5eItemActivationService(activation, targeting, midiWith(capture), dialogsWith(watch));

    const promise = service.activate(baseCommand);
    watch.open('consume');
    const outcome = await promise;

    expect(outcome).toEqual({
      itemId: 'i1',
      itemName: 'Sword',
      itemType: 'weapon',
      activated: false,
      status: 'awaiting_user_dialog',
      dialog: 'consume',
      targetsSet: 0,
      rolls: []
    });
    expect(activation.describe).toHaveBeenCalledWith('a1', 'i1');
    expect(capture.cancel).toHaveBeenCalled();
    expect(watch.cancel).toHaveBeenCalled();

    // the parked use finishing later must not throw or leak
    finishUse?.(used);
    await pending;
  });

  it('answers awaiting_user_dialog when a dialog opens during the Midi workflow', async () => {
    const neverCompletes = new Promise<MidiCaptureResult>(() => undefined);
    const capture = captureWith(neverCompletes);
    const watch = silentWatch();
    const service = new Dnd5eItemActivationService(activationWith(used), targeting, midiWith(capture), dialogsWith(watch));

    const promise = service.activate(baseCommand);
    await Promise.resolve();
    await Promise.resolve();
    watch.open('attack-roll');
    const outcome = await promise;

    expect(outcome.status).toBe('awaiting_user_dialog');
    expect(outcome.dialog).toBe('attack-roll');
    expect(outcome.activated).toBe(true);
    expect(outcome.chatMessageId).toBe('msg-1');
    expect(capture.cancel).toHaveBeenCalled();
  });

  it('reports a Midi timeout and an aborted workflow as statuses with warnings', async () => {
    const timeout = new Dnd5eItemActivationService(activationWith(used), targeting, midiWith(captureWith({ kind: 'timeout' })), dialogsWith(silentWatch()));
    const aborted = new Dnd5eItemActivationService(activationWith(used), targeting, midiWith(captureWith({ kind: 'aborted' })), dialogsWith(silentWatch()));

    const t = await timeout.activate(baseCommand);
    const a = await aborted.activate(baseCommand);

    expect([t.status, t.warning, t.workflow]).toEqual(['workflow_timeout', 'midi_workflow_timeout', undefined]);
    expect([a.status, a.warning, a.workflow]).toEqual(['workflow_aborted', 'midi_workflow_aborted', undefined]);
  });

  it('runs the deferred cleanup after the workflow completed', async () => {
    const cleanup = jest.fn(async () => undefined);
    const order: string[] = [];
    const capture: MidiWorkflowCapture = {
      await: jest.fn(async (): Promise<MidiCaptureResult> => {
        order.push('await');
        return { kind: 'completed', workflow };
      }),
      trackCard: jest.fn(),
      cancel: jest.fn()
    };
    cleanup.mockImplementation(async () => {
      order.push('cleanup');
    });
    const service = new Dnd5eItemActivationService(activationWith({ ...used, deferredCleanup: cleanup }), targeting, midiWith(capture), dialogsWith(silentWatch()));

    await service.activate(baseCommand);

    expect(order).toEqual(['await', 'cleanup']);
  });

  it('defers the cleanup to the next workflow end when a dialog parked the use', async () => {
    const cleanup = jest.fn(async () => undefined);
    const first = captureWith(new Promise<MidiCaptureResult>(() => undefined));
    const second = captureWith({ kind: 'completed', workflow });
    const captures = [first, second];
    const midi: MidiWorkflowPort = { isActive: jest.fn(() => true), captureNext: jest.fn(() => captures.shift() as MidiWorkflowCapture) };
    const watch = silentWatch();
    const service = new Dnd5eItemActivationService(activationWith({ ...used, deferredCleanup: cleanup }), targeting, midi, dialogsWith(watch));

    const promise = service.activate(baseCommand);
    await Promise.resolve();
    await Promise.resolve();
    watch.open('damage');
    const outcome = await promise;
    await Promise.resolve();
    await Promise.resolve();

    expect(outcome.status).toBe('awaiting_user_dialog');
    expect(midi.captureNext).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalled();
  });
});
