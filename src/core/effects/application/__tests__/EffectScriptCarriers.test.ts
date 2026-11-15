import type { ActorTarget } from '../../../shared';
import { EffectNotFoundError, type ScriptCarrierPolicy } from '../../domain';
import { EffectDetailsService } from '../EffectDetailsService';
import { EffectService } from '../EffectService';
import {
  FakeEffectDocumentStore,
  FakeEffectEnvironment,
  FakeEffectStore,
  FakeWorld,
  effect,
  effectDetails
} from './fakePorts';

const hero: ActorTarget = { kind: 'actor', actorId: 'a1' };
const RING = { itemId: 'ring', owner: null };
const ITEM_MACRO_CHANGE = { key: 'macro.itemMacro', value: '', mode: 0 };

function policy(allows: boolean | undefined): ScriptCarrierPolicy | undefined {
  return allows === undefined ? undefined : { allowsScripts: () => allows };
}

function actorEffects(allows: boolean | undefined): { service: EffectService; store: FakeEffectStore } {
  const store = new FakeEffectStore({
    'world:a1': [effect({ id: 'rage', name: 'Rage', changes: [ITEM_MACRO_CHANGE, { key: 'system.attributes.ac.bonus', value: '1', mode: 2 }] })]
  });
  const world = new FakeWorld([{ id: 'a1', name: 'Hero' }]);
  const service = new EffectService({
    scenes: world,
    actors: world,
    effects: store,
    environment: new FakeEffectEnvironment(),
    scripts: policy(allows)
  });
  return { service, store };
}

function itemEffects(allows: boolean): { service: EffectDetailsService; documents: FakeEffectDocumentStore } {
  const documents = new FakeEffectDocumentStore(
    { 'item:ring': { id: 'ring', name: 'Ring of Protection' } },
    {
      'item:ring': [
        effectDetails({
          id: 'aura',
          name: 'Protection',
          changes: [{ key: 'flags.midi-qol.onUseMacroName', type: 'custom', value: 'Kept', phase: 'initial', priority: null }]
        })
      ]
    }
  );
  const world = new FakeWorld([{ id: 'a1', name: 'Hero' }]);
  const service = new EffectDetailsService({
    scenes: world,
    actors: world,
    documents,
    environment: new FakeEffectEnvironment(),
    scripts: { allowsScripts: () => allows }
  });
  return { service, documents };
}

describe('EffectService — changes that automation modules run', () => {
  it('refuses a carrier in a new effect without the opt-in, or without a policy at all', async () => {
    for (const allows of [false, undefined]) {
      const { service, store } = actorEffects(allows);
      await expect(
        service.addEffect({ target: hero, draft: { name: 'Hex', changes: [{ key: 'macro.execute', value: 'Hex', mode: 0 }] } })
      ).rejects.toThrow('Script macros are disabled: changes.0 (macro.execute) makes DAE run a macro.');
      expect(store.created).toEqual([]);
    }
  });

  it('refuses a Foundry 14 system.changes carrier and a condition expression', async () => {
    const { service } = actorEffects(false);

    await expect(
      service.addEffect({ target: hero, draft: { name: 'Hex', system: { changes: [{ key: 'macro.itemMacro.GM', value: '' }] } } })
    ).rejects.toThrow('Script macros are disabled: system.changes.0 (macro.itemMacro.GM) makes DAE run a macro.');
    await expect(
      service.addEffect({
        target: hero,
        draft: { name: 'Fog', changes: [{ key: 'flags.midi-qol.disadvantage.attack.all', value: 'canSee(token, target)', mode: 0 }] }
      })
    ).rejects.toThrow('makes Midi-QOL run JavaScript');
  });

  it('adds carriers with the opt-in and ordinary automation without it', async () => {
    const allowed = actorEffects(true);
    await allowed.service.addEffect({ target: hero, draft: { name: 'Hex', changes: [{ key: 'macro.execute', value: 'Hex', mode: 0 }] } });
    expect(allowed.store.created).toHaveLength(1);

    const plain = actorEffects(false);
    await plain.service.addEffect({
      target: hero,
      draft: {
        name: 'Bless',
        changes: [
          { key: 'flags.midi-qol.advantage.attack.all', value: '1', mode: 0 },
          { key: 'flags.midi-qol.grants.disadvantage.attack.all', value: '1', mode: 0 },
          { key: 'flags.dae.specialDuration', value: 'turnStart', mode: 0 }
        ]
      }
    });
    expect(plain.store.created).toHaveLength(1);
  });

  it('keeps a stored carrier editable: the list may come back with it unchanged', async () => {
    const { service, store } = actorEffects(false);

    await service.updateEffect({
      target: hero,
      effectId: 'rage',
      changes: { changes: [{ key: 'system.attributes.ac.bonus', value: '2', mode: 2 }, ITEM_MACRO_CHANGE] }
    });
    await service.updateEffect({ target: hero, effectId: 'rage', changes: { name: 'Fury' } });

    expect(store.updated).toHaveLength(2);
  });

  it('refuses a carrier the stored effect does not hold, and reports a missing effect first', async () => {
    const { service, store } = actorEffects(false);

    await expect(
      service.updateEffect({
        target: hero,
        effectId: 'rage',
        changes: { changes: [{ key: 'macro.itemMacro', value: 'other', mode: 0 }] }
      })
    ).rejects.toThrow('Script macros are disabled: changes.0 (macro.itemMacro) makes DAE run a macro.');
    await expect(
      service.updateEffect({ target: hero, effectId: 'gone', changes: { changes: [{ key: 'macro.execute', value: 'x', mode: 0 }] } })
    ).rejects.toThrow(EffectNotFoundError);
    expect(store.updated).toEqual([]);
  });
});

describe('EffectDetailsService — changes that automation modules run', () => {
  it('refuses a carrier in a new item effect without the opt-in and creates it with the opt-in', async () => {
    const draft = {
      name: 'Burning',
      changes: [{ key: 'flags.midi-qol.OverTime', type: 'custom', value: 'turn=start, damageRoll=1d6, macro=Burn' }]
    };

    const off = itemEffects(false);
    await expect(off.service.createItemEffect({ item: RING, draft })).rejects.toThrow(
      'Script macros are disabled: changes.0 (flags.midi-qol.OverTime) makes Midi-QOL run a macro.'
    );
    expect(off.documents.created).toEqual([]);

    const on = itemEffects(true);
    await on.service.createItemEffect({ item: RING, draft });
    expect(on.documents.created).toHaveLength(1);
  });

  it('refuses a carrier in the opaque type data and lets the stored one through unchanged', async () => {
    const { service, documents } = itemEffects(false);

    await expect(
      service.updateItemEffect({
        item: RING,
        effectId: 'aura',
        changes: { system: { changes: [{ key: 'flags.midi-qol.onUseMacroName', type: 'custom', value: 'Other' }] } }
      })
    ).rejects.toThrow('Script macros are disabled: system.changes.0 (flags.midi-qol.onUseMacroName) makes Midi-QOL run a macro.');

    await service.updateItemEffect({
      item: RING,
      effectId: 'aura',
      changes: {
        changes: [
          { key: 'flags.midi-qol.onUseMacroName', type: 'custom', value: 'Kept' },
          { key: 'flags.midi-qol.OverTime', type: 'custom', value: 'turn=end, saveAbility=con, saveDC=13, damageRoll=1d6' }
        ]
      }
    });
    expect(documents.updated).toHaveLength(1);
  });
});
