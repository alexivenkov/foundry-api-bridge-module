import { activateItemHandler } from '../ActivateItemHandler';
import { useItemHandler } from '../UseItemHandler';
import { SUBSEQUENT_ROLL_WAIT_MS } from '@/systems/dnd5e/item-actions/infrastructure/activationRollHooks';
import { MIDI_WORKFLOW_TIMEOUT } from '@/systems/dnd5e/item-actions/infrastructure/Dnd5eMidiWorkflowGateway';

type Cb = (...args: unknown[]) => unknown;
const listeners = new Map<number, { hook: string; cb: Cb }>();
let nextId = 1;
const hooks = {
  on: jest.fn((hook: string, cb: Cb) => {
    listeners.set(nextId, { hook, cb });
    return nextId++;
  }),
  once: jest.fn((hook: string, cb: Cb) => {
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

function appOf(...chain: string[]): unknown {
  let ctor: ((...args: never[]) => unknown) | undefined;
  for (const name of [...chain].reverse()) {
    const parent = ctor;
    const cls = { [name]: class {} }[name] as unknown as (...args: never[]) => unknown;
    if (parent) Object.setPrototypeOf(cls, parent);
    ctor = cls;
  }
  return { constructor: ctor };
}

const activity = { _id: 'act-1', name: 'Attack', type: 'attack', target: { affects: { type: 'creature' } }, use: jest.fn() };
const secondWind = { _id: 'act-sw', name: 'Second Wind', type: 'heal', target: { affects: { type: 'self' } }, use: jest.fn() };
const weapon = {
  id: 'weapon-1',
  name: 'Light Hammer',
  type: 'weapon',
  system: { activities: { contents: [activity], get: jest.fn(), find: jest.fn() } },
  use: jest.fn(),
  displayCard: jest.fn()
};
const feature = {
  id: 'feat-1',
  name: 'Second Wind',
  type: 'feat',
  system: { activities: { contents: [secondWind], get: jest.fn(), find: jest.fn() } },
  use: jest.fn(),
  displayCard: jest.fn()
};
const hp = { value: 10, max: 20, temp: 0 };
const actor = {
  id: 'actor-1',
  name: 'Fighter',
  items: { get: jest.fn() },
  system: { attributes: { hp } },
  getActiveTokens: jest.fn().mockReturnValue([{ id: 'tok-fighter' }]),
  applyDamage: jest.fn()
};
const user = { id: 'u1', targets: new Set<unknown>() };
const modules = { get: jest.fn() };
const canvasTokens = { get: jest.fn() };
const game = { actors: { get: jest.fn() }, user, modules, system: { id: 'dnd5e' } };

const usageResult = { rolls: [], message: { id: 'card-1' } };
const attackRoll = { total: 15, formula: '1d20 + 5', terms: [{ faces: 20, number: 1, results: [{ result: 10, active: true }] }], options: { advantageMode: 0 } };

async function settle<T>(promise: Promise<T>): Promise<T> {
  await jest.advanceTimersByTimeAsync(SUBSEQUENT_ROLL_WAIT_MS);
  return promise;
}

describe('activateItemHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    nextId = 1;
    jest.useFakeTimers();
    hp.value = 10;
    user.targets.clear();
    modules.get.mockReturnValue(undefined);
    game.actors.get.mockReturnValue(actor);
    actor.items.get.mockImplementation((id: string) => (id === 'weapon-1' ? weapon : id === 'feat-1' ? feature : undefined));
    weapon.system.activities.get.mockReturnValue(undefined);
    weapon.system.activities.find.mockReturnValue(undefined);
    activity.use.mockResolvedValue(usageResult);
    secondWind.use.mockResolvedValue(usageResult);
    (globalThis as Record<string, unknown>)['game'] = game;
    (globalThis as Record<string, unknown>)['canvas'] = { tokens: canvasTokens, scene: { createEmbeddedDocuments: jest.fn() } };
    (globalThis as Record<string, unknown>)['Hooks'] = hooks;
    (globalThis as Record<string, unknown>)['dnd5e'] = { canvas: { AbilityTemplate: { prototype: { drawPreview: jest.fn() } } } };
    (globalThis as Record<string, unknown>)['fromUuidSync'] = jest.fn().mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('completes a vanilla attack: fast-forward config, card, the attack roll with its mode', async () => {
    activity.use.mockImplementation(async () => {
      const config = { subject: { id: 'act-1' }, rolls: [{ parts: ['@mod'], options: {} }] };
      const dialog = { configure: true };
      fire('dnd5e.preRollAttackV2', config, dialog);
      expect(dialog.configure).toBe(false);
      expect(config).toEqual(expect.objectContaining({ attackMode: 'thrown', disadvantage: true }));
      fire('dnd5e.rollAttackV2', [attackRoll], { subject: { id: 'act-1' } });
      return usageResult;
    });

    const result = await settle(activateItemHandler({
      actorId: 'actor-1',
      itemId: 'weapon-1',
      attackMode: 'thrown',
      disadvantage: true,
      attackBonus: 2
    }));

    expect(activity.use).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { measuredTemplate: false },
        event: { shiftKey: true },
        midiOptions: expect.objectContaining({ configureDialog: false, workflowOptions: expect.objectContaining({ disadvantage: true, attackMode: 'thrown', autoRollAttack: true }) })
      }),
      { configure: false },
      { create: true }
    );
    expect(result.status).toBe('completed');
    expect(result.activated).toBe(true);
    expect(result.chatMessageId).toBe('card-1');
    expect(result.rolls).toEqual([{ total: 15, formula: '1d20 + 5', dice: [{ type: 'd20', count: 1, results: [10] }], mode: 'normal', kept: 10 }]);
    expect(result.workflow).toBeUndefined();
  });

  it('rejects advantage together with disadvantage before touching Foundry', async () => {
    await expect(activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1', advantage: true, disadvantage: true }))
      .rejects.toThrow('Cannot have both advantage and disadvantage');
    expect(activity.use).not.toHaveBeenCalled();
  });

  it('answers awaiting_user_dialog within the tick a dialog renders, instead of waiting', async () => {
    activity.use.mockImplementation(() => new Promise(() => undefined));

    const promise = activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1' });
    await Promise.resolve();
    fire('renderApplicationV2', appOf('AttackRollConfigurationDialog', 'D20RollConfigurationDialog', 'RollConfigurationDialog', 'Dialog5e', 'ApplicationV2'));
    const result = await promise;

    expect(result).toEqual({
      itemId: 'weapon-1',
      itemName: 'Light Hammer',
      itemType: 'weapon',
      activated: false,
      status: 'awaiting_user_dialog',
      dialog: 'attack-roll',
      targetsSet: 0,
      rolls: []
    });
    // The dialog watch and the Midi capture are gone; the roll hooks stay until the parked use ends.
    expect([...listeners.values()].some((l) => l.hook.startsWith('render') || l.hook.startsWith('midi-qol.Roll'))).toBe(false);
  });

  it('lets the dialogs through when fastForward is false', async () => {
    const result = await settle(activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1', fastForward: false }));

    expect(activity.use).toHaveBeenCalledWith({ create: { measuredTemplate: false } }, { configure: true }, { create: true });
    expect(result.status).toBe('completed');
  });

  describe('with Midi-QOL', () => {
    beforeEach(() => {
      modules.get.mockReturnValue({ active: true });
    });

    it('returns the workflow with applied damage once RollComplete fires', async () => {
      (globalThis as Record<string, unknown>)['fromUuidSync'] = jest.fn().mockReturnValue({ actor: { system: { attributes: { hp: { value: 1, max: 7, temp: 0 } } } } });
      activity.use.mockImplementation(async () => {
        setTimeout(() => {
          fire('midi-qol.RollComplete', {
            attackTotal: 19,
            damageTotal: 6,
            isCritical: false,
            isFumble: false,
            hitTargets: new Set([{ id: 'gob-1' }]),
            saves: new Set(),
            failedSaves: new Set(),
            damageList: [{ targetUuid: 'Scene.s.Token.gob-1', oldHP: 7, newHP: 1, oldTempHP: 0, newTempHP: 0, hpDamage: 6 }]
          });
        }, 10);
        return usageResult;
      });

      const promise = activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1', targetAcBonus: 2 });
      await jest.advanceTimersByTimeAsync(20);
      const result = await promise;

      expect(result.status).toBe('completed');
      expect(result.workflow).toEqual({
        attackTotal: 19,
        damageTotal: 6,
        isCritical: false,
        isFumble: false,
        hitTargetIds: ['gob-1'],
        saveTargetIds: [],
        failedSaveTargetIds: [],
        appliedDamage: { 'gob-1': { applied: true, hpBefore: 7, hpAfter: 1, tempBefore: 0, tempAfter: 0 } }
      });
      expect(result.appliedDamage).toEqual(result.workflow?.appliedDamage);
      expect(listeners.size).toBe(0);
    });

    it('reports a timeout below the platform gate and an abort when the card is deleted', async () => {
      const timedOut = activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1' });
      await jest.advanceTimersByTimeAsync(MIDI_WORKFLOW_TIMEOUT);
      const t = await timedOut;
      expect([t.status, t.warning, t.workflow]).toEqual(['workflow_timeout', 'midi_workflow_timeout', undefined]);

      listeners.clear();
      activity.use.mockImplementation(async () => {
        setTimeout(() => fire('deleteChatMessage', { id: 'card-1' }), 5);
        return usageResult;
      });
      const aborted = activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1' });
      await jest.advanceTimersByTimeAsync(10);
      const a = await aborted;
      expect([a.status, a.warning]).toEqual(['workflow_aborted', 'midi_workflow_aborted']);
    });

    it('answers awaiting_user_dialog when Midi opens a dialog mid-workflow', async () => {
      activity.use.mockImplementation(async () => {
        setTimeout(() => fire('renderApplicationV2', appOf('MidiActivityUsageDialog', 'ActivityUsageDialog', 'Dialog5e', 'ApplicationV2')), 5);
        return usageResult;
      });

      const promise = activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1' });
      await jest.advanceTimersByTimeAsync(10);
      const result = await promise;

      expect(result.status).toBe('awaiting_user_dialog');
      expect(result.dialog).toBe('consume');
      expect(result.activated).toBe(true);
      expect(result.chatMessageId).toBe('card-1');
    });

    it('acts as the requested token of the actor', async () => {
      const token = { id: 'tok-2', actor: { ...actor, id: 'actor-1' }, control: jest.fn(), setTarget: jest.fn() };
      canvasTokens.get.mockImplementation((id: string) => (id === 'tok-2' ? token : undefined));
      activity.use.mockImplementation(async () => {
        setTimeout(() => fire('midi-qol.RollComplete', { hitTargets: new Set(), saves: new Set(), failedSaves: new Set() }), 1);
        return usageResult;
      });

      const promise = activateItemHandler({ actorId: 'actor-1', itemId: 'weapon-1', attackerTokenId: 'tok-2' });
      await jest.advanceTimersByTimeAsync(5);
      await promise;

      expect(token.control).toHaveBeenCalledWith({ releaseOthers: true });
    });
  });

  it('throws for a missing actor or item', async () => {
    game.actors.get.mockReturnValue(undefined);
    await expect(activateItemHandler({ actorId: 'nope', itemId: 'weapon-1' })).rejects.toThrow('Actor not found: nope');

    game.actors.get.mockReturnValue(actor);
    await expect(activateItemHandler({ actorId: 'actor-1', itemId: 'nope' })).rejects.toThrow('Item not found: nope');
  });
});

describe('useItemHandler on a self-targeted heal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    jest.useFakeTimers();
    hp.value = 10;
    modules.get.mockReturnValue(undefined);
    game.actors.get.mockReturnValue(actor);
    actor.items.get.mockImplementation((id: string) => (id === 'feat-1' ? feature : undefined));
    feature.system.activities.get.mockReturnValue(undefined);
    feature.system.activities.find.mockReturnValue(undefined);
    secondWind.use.mockReset();
    secondWind.use.mockResolvedValue(usageResult);
    actor.applyDamage.mockImplementation(async () => {
      hp.value = 18;
    });
    (globalThis as Record<string, unknown>)['game'] = game;
    (globalThis as Record<string, unknown>)['canvas'] = { tokens: canvasTokens, scene: {} };
    (globalThis as Record<string, unknown>)['Hooks'] = hooks;
    (globalThis as Record<string, unknown>)['dnd5e'] = { canvas: { AbilityTemplate: { prototype: { drawPreview: jest.fn() } } } };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rolls through the activation pipeline and heals the actor without Midi-QOL', async () => {
    secondWind.use.mockImplementation(async () => {
      fire('dnd5e.rollDamageV2', [{ total: 8, formula: '1d10 + 3', terms: [{ faces: 10, number: 1, results: [{ result: 5 }] }] }], { subject: { id: 'act-sw' } });
      return usageResult;
    });

    const result = await settle(useItemHandler({ actorId: 'actor-1', itemId: 'feat-1' }));

    expect(secondWind.use).toHaveBeenCalledWith(expect.anything(), { configure: false }, { create: true });
    expect(actor.applyDamage).toHaveBeenCalledWith([{ value: 8, type: 'healing' }]);
    expect(result.status).toBe('completed');
    expect(result.rolls[0]?.total).toBe(8);
    expect(result.appliedHealing).toEqual({ 'tok-fighter': { applied: true, hpBefore: 10, hpAfter: 18, tempBefore: 0, tempAfter: 0 } });
    expect(result.chatMessageId).toBe('card-1');
  });

  it('does not claim success when the heal never rolled', async () => {
    const result = await settle(useItemHandler({ actorId: 'actor-1', itemId: 'feat-1' }));

    expect(actor.applyDamage).not.toHaveBeenCalled();
    expect(result.warning).toBe('no_roll_performed');
    expect(result.rolls).toEqual([]);
  });

  it('passes consume: false on as no resource consumption', async () => {
    await settle(useItemHandler({ actorId: 'actor-1', itemId: 'feat-1', consume: false }));

    expect(secondWind.use.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ consume: { spellSlot: false, resources: false } }));
  });
});
