import { Dnd5eItemActivationGateway, buildUsageConfig } from '../Dnd5eItemActivationGateway';
import { SUBSEQUENT_ROLL_WAIT_MS } from '../activationRollHooks';
import type { ActivateItemOptions } from '@/systems/dnd5e/item-actions/domain';
import { ActorNotFoundError } from '@/systems/shared/domain/errors';

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

const usageResult = {
  rolls: [],
  message: { id: 'chat-1' }
};

const abilityTemplate = { prototype: { drawPreview: jest.fn() } };
const scene = { createEmbeddedDocuments: jest.fn().mockResolvedValue([]) };
const modules = { get: jest.fn() };
const user = { id: 'u1', targets: new Set<unknown>() };
const canvasTokens = { get: jest.fn() };

function makeActor(item: unknown) {
  return {
    id: 'a1',
    name: 'Hero',
    items: { get: jest.fn().mockReturnValue(item) },
    system: { attributes: { hp: { value: 10, max: 20, temp: 0 } } },
    getActiveTokens: jest.fn().mockReturnValue([{ id: 'tok-hero' }]),
    applyDamage: jest.fn()
  };
}

function setGlobals(item: unknown, actor = makeActor(item)): ReturnType<typeof makeActor> {
  (globalThis as Record<string, unknown>)['game'] = { actors: { get: jest.fn().mockReturnValue(actor) }, user, modules };
  (globalThis as Record<string, unknown>)['canvas'] = { tokens: canvasTokens, scene };
  (globalThis as Record<string, unknown>)['dnd5e'] = { canvas: { AbilityTemplate: abilityTemplate } };
  (globalThis as Record<string, unknown>)['Hooks'] = hooks;
  return actor;
}

function itemWith(activity: Record<string, unknown> | undefined, overrides: Record<string, unknown> = {}) {
  return {
    id: 'i1',
    name: 'Sword',
    type: 'weapon',
    system: activity
      ? { activities: { contents: [activity], get: jest.fn().mockReturnValue(activity), find: jest.fn().mockReturnValue(activity) } }
      : {},
    use: jest.fn(),
    displayCard: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

function attackActivity(use: jest.Mock) {
  return { _id: 'act-1', name: 'Attack', type: 'attack', use };
}

const noOpts: ActivateItemOptions = {
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

const fastForwardMidi = {
  autoFastAttack: true,
  fastForwardAttack: true,
  fastForwardDamage: true,
  autoRollAttack: true,
  autoRollDamage: 'onHit',
  targetConfirmation: 'none'
};

/** Runs an activation while fake timers let the vanilla roll wait elapse. */
async function activate(gateway: Dnd5eItemActivationGateway, options: ActivateItemOptions) {
  const promise = gateway.activate('a1', 'i1', options);
  await jest.advanceTimersByTimeAsync(SUBSEQUENT_ROLL_WAIT_MS);
  return promise;
}

describe('buildUsageConfig', () => {
  it('fast-forwards dnd5e and Midi-QOL by default and suppresses the template', () => {
    expect(buildUsageConfig(noOpts)).toEqual({
      create: { measuredTemplate: false },
      event: { shiftKey: true },
      midiOptions: { configureDialog: false, workflowOptions: fastForwardMidi }
    });
  });

  it('maps spell level, consumption, flags and attack mode', () => {
    expect(buildUsageConfig({
      ...noOpts,
      templatePosition: { x: 1, y: 2 },
      spellLevel: 3,
      consume: { spellSlot: false, itemUses: true, ammunition: false },
      advantage: true,
      attackMode: 'twoHanded'
    })).toEqual({
      spell: { slot: 'spell3' },
      consume: { spellSlot: false, resources: true },
      event: { shiftKey: true },
      midiOptions: { configureDialog: false, workflowOptions: { ...fastForwardMidi, advantage: true, attackMode: 'twoHanded' } }
    });
  });

  it('leaves dialogs and auto-rolls to the client when fastForward is off', () => {
    expect(buildUsageConfig({ ...noOpts, fastForward: false })).toEqual({ create: { measuredTemplate: false } });
    expect(buildUsageConfig({ ...noOpts, fastForward: false, disadvantage: true })).toEqual({
      create: { measuredTemplate: false },
      midiOptions: { workflowOptions: { disadvantage: true } }
    });
  });
});

describe('Dnd5eItemActivationGateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    nextId = 1;
    jest.useFakeTimers();
    user.targets.clear();
    modules.get.mockReturnValue(undefined);
    canvasTokens.get.mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses the activity with fast-forward config, no dialog, a chat card, and collects the vanilla attack roll', async () => {
    const attackRoll = { total: 18, formula: '2d20kh + 5', terms: [{ faces: 20, number: 2, results: [{ result: 13, active: true }, { result: 4, active: false }] }], options: { advantageMode: 1 } };
    const use = jest.fn().mockImplementation(async () => {
      fire('dnd5e.preRollAttackV2', { subject: { id: 'act-1' }, rolls: [{ parts: [] }] }, {});
      fire('dnd5e.rollAttackV2', [attackRoll], { subject: { id: 'act-1' } });
      return usageResult;
    });
    setGlobals(itemWith(attackActivity(use)));

    const outcome = await activate(new Dnd5eItemActivationGateway(), { ...noOpts, advantage: true });

    expect(use).toHaveBeenCalledWith(
      expect.objectContaining({ create: { measuredTemplate: false }, event: { shiftKey: true } }),
      { configure: false },
      { create: true }
    );
    expect(outcome.activityUsed).toEqual({ id: 'act-1', name: 'Attack', type: 'attack' });
    expect(outcome.chatMessageId).toBe('chat-1');
    expect(outcome.rolls).toEqual([{ total: 18, formula: '2d20kh + 5', dice: [{ type: 'd20', count: 2, results: [13, 4] }], mode: 'advantage', kept: 13 }]);
    expect(outcome.warning).toBeUndefined();
  });

  it('warns when dnd5e never rolled, and disposes the hooks on cleanup', async () => {
    const use = jest.fn().mockResolvedValue(usageResult);
    setGlobals(itemWith(attackActivity(use)));

    const outcome = await activate(new Dnd5eItemActivationGateway(), noOpts);

    expect(outcome.warning).toBe('no_roll_performed');
    expect(listeners.size).toBeGreaterThan(0);
    await outcome.deferredCleanup?.();
    expect(listeners.size).toBe(0);
  });

  it('does not wait for rolls when Midi-QOL runs the workflow', async () => {
    modules.get.mockReturnValue({ active: true });
    const use = jest.fn().mockResolvedValue(usageResult);
    setGlobals(itemWith(attackActivity(use)));

    const outcome = await new Dnd5eItemActivationGateway().activate('a1', 'i1', noOpts);

    expect(outcome.warning).toBeUndefined();
    expect(use.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ midiOptions: { configureDialog: false, workflowOptions: fastForwardMidi } }));
  });

  it('applies a self heal itself without Midi-QOL and reports it per token', async () => {
    const healRoll = { total: 7, formula: '1d10 + 2', terms: [{ faces: 10, number: 1, results: [{ result: 5 }] }] };
    const use = jest.fn().mockImplementation(async () => {
      fire('dnd5e.rollDamageV2', [healRoll], { subject: { id: 'act-h' } });
      return usageResult;
    });
    const heal = { _id: 'act-h', name: 'Second Wind', type: 'heal', target: { affects: { type: 'self' } }, use };
    const actor = setGlobals(itemWith(heal));
    actor.applyDamage.mockImplementation(async () => {
      actor.system.attributes.hp.value = 17;
    });

    const outcome = await activate(new Dnd5eItemActivationGateway(), noOpts);

    expect(actor.applyDamage).toHaveBeenCalledWith([{ value: 7, type: 'healing' }]);
    expect(outcome.appliedHealing).toEqual({ 'tok-hero': { applied: true, hpBefore: 10, hpAfter: 17, tempBefore: 0, tempAfter: 0 } });
    expect(outcome.rolls).toHaveLength(1);
  });

  it('heals the current targets when the heal is not self-targeted', async () => {
    const targetActor = { system: { attributes: { hp: { value: 2, max: 9, temp: 0 } } }, applyDamage: jest.fn() };
    user.targets.add({ id: 'tok-ally', actor: targetActor, setTarget: jest.fn() });
    const use = jest.fn().mockImplementation(async () => {
      fire('dnd5e.rollDamageV2', [{ total: 4, formula: '1d4', terms: [] }], { subject: { id: 'act-h' } });
      return usageResult;
    });
    const heal = { _id: 'act-h', name: 'Cure Wounds', type: 'heal', target: { affects: { type: 'creature' } }, use };
    const actor = setGlobals(itemWith(heal));

    const outcome = await activate(new Dnd5eItemActivationGateway(), noOpts);

    expect(actor.applyDamage).not.toHaveBeenCalled();
    expect(targetActor.applyDamage).toHaveBeenCalledWith([{ value: 4, type: 'healing' }]);
    expect(outcome.appliedHealing).toEqual({ 'tok-ally': { applied: true, hpBefore: 2, hpAfter: 2, tempBefore: 0, tempAfter: 0 } });
  });

  it('deletes a consumable it kept alive once the cleanup runs', async () => {
    const use = jest.fn().mockImplementation(async () => {
      fire('dnd5e.activityConsumption', { id: 'act-c' }, {}, {}, { delete: ['i1'], item: [] });
      fire('dnd5e.rollDamageV2', [{ total: 5, formula: '2d4', terms: [] }], { subject: { id: 'act-c' } });
      return usageResult;
    });
    const potionActivity = { _id: 'act-c', name: 'Drink', type: 'heal', target: { affects: { type: 'self' } }, use };
    const item = itemWith(potionActivity);
    const actor = setGlobals(item);

    const outcome = await activate(new Dnd5eItemActivationGateway(), noOpts);

    expect(item.delete).not.toHaveBeenCalled();
    await outcome.deferredCleanup?.();
    expect(actor.items.get).toHaveBeenCalledWith('i1');
    expect(item.delete).toHaveBeenCalled();
  });

  it('acts as the given token: its actor, controlled first', async () => {
    const use = jest.fn().mockResolvedValue(usageResult);
    const item = itemWith(attackActivity(use));
    const worldActor = makeActor(undefined);
    const tokenActor = { ...makeActor(item), id: 'a1' };
    const token = { id: 'tok-2', actor: tokenActor, control: jest.fn(), setTarget: jest.fn() };
    setGlobals(undefined, worldActor);
    canvasTokens.get.mockImplementation((id: string) => (id === 'tok-2' ? token : undefined));
    modules.get.mockReturnValue({ active: true });

    await new Dnd5eItemActivationGateway().activate('a1', 'i1', { ...noOpts, attackerTokenId: 'tok-2' });

    expect(token.control).toHaveBeenCalledWith({ releaseOthers: true });
    expect(tokenActor.items.get).toHaveBeenCalledWith('i1');
    expect(worldActor.items.get).not.toHaveBeenCalled();
  });

  it('rejects an attacker token that is missing or belongs to someone else', async () => {
    const use = jest.fn().mockResolvedValue(usageResult);
    setGlobals(itemWith(attackActivity(use)));
    const gateway = new Dnd5eItemActivationGateway();

    await expect(gateway.activate('a1', 'i1', { ...noOpts, attackerTokenId: 'nope' })).rejects.toThrow('Target token not found: nope');

    canvasTokens.get.mockReturnValue({ id: 'tok-x', actor: { id: 'someone-else', items: { get: jest.fn() } } });
    await expect(gateway.activate('a1', 'i1', { ...noOpts, attackerTokenId: 'tok-x' })).rejects.toThrow('Token tok-x does not belong to actor a1');
  });

  it('keeps the template when a position is given and falls back to item.use without an activity', async () => {
    const itemUse = jest.fn().mockResolvedValue(null);
    setGlobals(itemWith(undefined, { use: itemUse }));

    const outcome = await activate(new Dnd5eItemActivationGateway(), { ...noOpts, templatePosition: { x: 5, y: 5 } });

    expect(itemUse.mock.calls[0]?.[0]).toEqual(expect.not.objectContaining({ create: expect.anything() }));
    expect(outcome.activityUsed).toBeUndefined();
  });

  it('describes an item and throws ActorNotFoundError / ItemNotFoundError', () => {
    setGlobals(itemWith(attackActivity(jest.fn())));
    expect(new Dnd5eItemActivationGateway().describe('a1', 'i1')).toEqual({ itemId: 'i1', itemName: 'Sword', itemType: 'weapon' });

    (globalThis as Record<string, unknown>)['game'] = { actors: { get: jest.fn().mockReturnValue(undefined) }, user, modules };
    expect(() => new Dnd5eItemActivationGateway().describe('missing', 'i1')).toThrow(ActorNotFoundError);

    setGlobals(undefined);
    expect(() => new Dnd5eItemActivationGateway().describe('a1', 'missing')).toThrow('Item not found: missing');
  });
});
