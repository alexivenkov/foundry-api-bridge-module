import { Dnd5eItemActivationService } from '../Dnd5eItemActivationService';
import type {
  ActivationUseOutcome,
  ItemActivationPort,
  MidiWorkflowCapture,
  MidiWorkflowOutcome,
  MidiWorkflowPort,
  TargetingPort
} from '@/systems/dnd5e/item-actions/domain';

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
  failedSaveTargetIds: []
};

const baseCommand = {
  actorId: 'a1',
  itemId: 'i1',
  activityId: undefined,
  activityType: undefined,
  targetTokenIds: [] as readonly string[],
  templatePosition: undefined,
  spellLevel: undefined
};

describe('Dnd5eItemActivationService', () => {
  it('sets targets, arms Midi before use, then awaits the capture after', async () => {
    const order: string[] = [];
    const targeting: TargetingPort = {
      setTargets: jest.fn((ids: readonly string[]) => {
        order.push('setTargets');
        return ids.length;
      })
    };
    const activation: ItemActivationPort = {
      activate: jest.fn(async () => {
        order.push('activate');
        return used;
      })
    };
    const capture: MidiWorkflowCapture = {
      await: jest.fn(async () => {
        order.push('await');
        return workflow;
      }),
      cancel: jest.fn()
    };
    const midi: MidiWorkflowPort = {
      isActive: jest.fn(() => true),
      captureNext: jest.fn(() => {
        order.push('captureNext');
        return capture;
      })
    };

    const service = new Dnd5eItemActivationService(activation, targeting, midi);
    const outcome = await service.activate({ ...baseCommand, targetTokenIds: ['t1', 't2'] });

    expect(order).toEqual(['setTargets', 'captureNext', 'activate', 'await']);
    expect(outcome.targetsSet).toBe(2);
    expect(outcome.activated).toBe(true);
    expect(outcome.workflow).toBe(workflow);
    expect(outcome.activityUsed).toEqual({ id: 'act-1', name: 'Attack', type: 'attack' });
    expect(outcome.chatMessageId).toBe('msg-1');
  });

  it('skips Midi capture when inactive', async () => {
    const targeting: TargetingPort = { setTargets: jest.fn(() => 0) };
    const activation: ItemActivationPort = { activate: jest.fn(async () => used) };
    const captureNext = jest.fn();
    const midi: MidiWorkflowPort = { isActive: jest.fn(() => false), captureNext };

    const service = new Dnd5eItemActivationService(activation, targeting, midi);
    const outcome = await service.activate(baseCommand);

    expect(captureNext).not.toHaveBeenCalled();
    expect(outcome.workflow).toBeUndefined();
  });

  it('cancels the capture if activation throws', async () => {
    const targeting: TargetingPort = { setTargets: jest.fn(() => 0) };
    const activation: ItemActivationPort = {
      activate: jest.fn(async () => {
        throw new Error('boom');
      })
    };
    const capture: MidiWorkflowCapture = { await: jest.fn(), cancel: jest.fn() };
    const midi: MidiWorkflowPort = { isActive: jest.fn(() => true), captureNext: jest.fn(() => capture) };

    const service = new Dnd5eItemActivationService(activation, targeting, midi);

    await expect(service.activate(baseCommand)).rejects.toThrow('boom');
    expect(capture.cancel).toHaveBeenCalled();
    expect(capture.await).not.toHaveBeenCalled();
  });
});
