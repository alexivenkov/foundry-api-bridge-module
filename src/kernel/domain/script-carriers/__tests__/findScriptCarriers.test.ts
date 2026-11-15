import {
  findEffectChangeCarriers,
  findFlagCarriers,
  findScriptCarriers,
  introducedScriptCarriers,
  type ScriptCarrier
} from '../findScriptCarriers';

function paths(carriers: readonly ScriptCarrier[]): string[] {
  return carriers.map(carrier => carrier.path);
}

function describeCarrier(carrier: ScriptCarrier | undefined): string {
  return carrier === undefined ? 'none' : `${carrier.module} runs ${carrier.runs}`;
}

function flag(scope: string, key: string, value: unknown, documentType = 'Actor'): string {
  return describeCarrier(findFlagCarriers(documentType, scope, key, value)[0]);
}

function change(key: string, value: unknown): string {
  return describeCarrier(findEffectChangeCarriers([{ key, value, mode: 0 }])[0]);
}

describe('findScriptCarriers — flags', () => {
  it.each([
    ['itemacro', 'macro.command', 'return 1;', 'Item Macro runs a macro'],
    ['itemacro', 'macro.data.command', 'return 1;', 'Item Macro runs a macro'],
    ['itemacro', 'macro.ownership.default', 3, 'Item Macro runs a macro'],
    ['dae', 'macro.command', 'game.togglePause()', 'DAE runs a macro'],
    ['dae', 'itemMacro', 'game.togglePause()', 'DAE runs a macro'],
    ['dae', 'onUpdateTarget', [{ macroName: 'Hook', filter: 'system' }], 'DAE runs a macro'],
    ['dae', 'onUpdateSource', 'x', 'DAE runs a macro'],
    ['dae', 'enableCondition', '@attributes.hp.value > 3', 'DAE runs JavaScript'],
    ['dae', 'disableCondition', 'globalThis.x', 'DAE runs JavaScript'],
    ['midi-qol', 'onUseMacroName', '[postActiveEffects]ItemMacro', 'Midi-QOL runs a macro'],
    ['midi-qol', 'onUseMacroParts', { items: [{ macroName: 'Boom', option: 'all' }] }, 'Midi-QOL runs a macro'],
    ['midi-qol', 'optional.bardic.macroToCall', 'Inspire', 'Midi-QOL runs a macro'],
    ['midi-qol', 'optional.bardic.damage.all', 'ItemMacro', 'Midi-QOL runs a macro'],
    ['midi-qol', 'optional.bardic.attack.all', 'function.MyModule.bonus', 'Midi-QOL runs a macro'],
    ['midi-qol', 'optional.bardic.save.all', 'Macro.Lucky', 'Midi-QOL runs a macro'],
    ['midi-qol', 'optional.bardic.activation', 'target.name === "Orc"', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'optional.bardic.force', 'true && fetch("x")', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'advantage.attack.all', 'workflow.targets.size > 1', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'grants.disadvantage.attack.all', '@details.cr > 2', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'grants.criticalThreshold', '18 + fetch("x")', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'max.damage.all', 'item.name', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'rangeOverride.attack.all', 'x()', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'DR.unknownType', 'x()', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'someFutureFlag', 'x()', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'ActivityOverTime', 'fromUuidSync("x")', 'Midi-QOL runs JavaScript'],
    ['midi-qol', 'rollModifiers.attack.all', 'r1;alert(1)', 'Midi-QOL runs JavaScript'],
    ['dnd5e', 'DamageBonusMacro', 'Sneak Attack', 'Midi-QOL runs a macro'],
    ['dnd5e', 'sharpShooter', 'canSee(token, target)', 'Midi-QOL runs JavaScript'],
    ['world', 'note', 'dae.eval(globalThis.alert(1))', 'DAE runs JavaScript']
  ])('flags.%s.%s = %j → %s', (scope, key, value, expected) => {
    expect(flag(scope, key, value)).toBe(expected);
  });

  it.each([
    ['midi-qol', 'advantage.attack.all', '1'],
    ['midi-qol', 'advantage.attack.all', true],
    ['midi-qol', 'advantage.all', ' true '],
    ['midi-qol', 'grants.disadvantage.attack.all', 1],
    ['midi-qol', 'grants.advantage.attack.mwak', 'false'],
    ['midi-qol', 'grants.criticalThreshold', '18'],
    ['midi-qol', 'grants.attack.bonus.all', '1d4 + @abilities.wis.mod'],
    ['midi-qol', 'grants.bonus.damage.mwak', '2d6[fire]'],
    ['midi-qol', 'DR.all', '@prof'],
    ['midi-qol', 'DR.fire', 'floor(@prof / 2)'],
    ['midi-qol', 'concentrationSaveBonus', '1d4'],
    ['midi-qol', 'optional.bardic.label', 'Bardic Inspiration (Macro)'],
    ['midi-qol', 'optional.bardic.count', 'ItemUses.Bardic Inspiration'],
    ['midi-qol', 'optional.bardic.attack.all', '1d6'],
    ['midi-qol', 'optional.bardic.damage.all', '@scale.bard.inspiration'],
    ['midi-qol', 'ActivityOverTime', 'Compendium.world.items.Item.abc.Activity.def'],
    ['midi-qol', 'rollModifiers.attack.all', 'r<2'],
    ['midi-qol', 'actions.reactionsUsed', 1],
    ['midi-qol', 'transformedActorUuids', ['Actor.abc']],
    ['midi-qol', 'onUseMacroName', ''],
    ['midi-qol', 'onUseMacroName', null],
    ['dae', 'specialDuration', ['turnStart', 'isAttacked']],
    ['dae', 'durationExpression', '1d4'],
    ['dae', 'stackable', 'multi'],
    ['dae', 'macroRepeat', 'startEveryTurn'],
    ['dae', 'itemUuid', 'Actor.a.Item.b'],
    ['dae', 'macro.name', 'My macro'],
    ['dae', 'enableCondition', 'true'],
    ['dnd5e', 'weaponCriticalThreshold', 'code()'],
    ['dnd5e', 'sharpShooter', true],
    ['core', 'sheetClass', 'dnd5e.CharacterActorSheet'],
    ['world', 'note', 'dae.roll(1d4)']
  ])('flags.%s.%s = %j stays writable', (scope, key, value) => {
    expect(findFlagCarriers('Actor', scope, key, value)).toEqual([]);
  });

  it('reports the path the caller wrote and the module that runs it', () => {
    expect(findFlagCarriers('Item', 'midi-qol', 'onUseMacroName', 'Boom')).toEqual([
      {
        path: 'flags.midi-qol.onUseMacroName',
        module: 'Midi-QOL',
        runs: 'a macro',
        identity: 'flags.midi-qol.onUseMacroName|"Boom"'
      }
    ]);
  });

  it('reads nested objects, dot-notation keys and their mix the same way', () => {
    const nested = findScriptCarriers('Item', { flags: { 'midi-qol': { onUseMacroName: 'Boom' } } });
    const dotted = findScriptCarriers('Item', { 'flags.midi-qol.onUseMacroName': 'Boom' });
    const mixed = findScriptCarriers('Item', { flags: { 'midi-qol.onUseMacroName': 'Boom' } });
    expect(paths(nested)).toEqual(['flags.midi-qol.onUseMacroName']);
    expect(dotted).toEqual(nested);
    expect(mixed).toEqual(nested);
  });

  it('reads a whole scope assigned as an object down to its leaves', () => {
    const found = findScriptCarriers('Item', {
      flags: { itemacro: { macro: { name: 'X', type: 'script', command: 'return 1' } }, dae: { macro: { name: 'Y' } } }
    });
    expect(paths(found)).toEqual(['flags.itemacro.macro.name', 'flags.itemacro.macro.type', 'flags.itemacro.macro.command']);
  });

  it('skips deletions and reads a replacement operator as its key', () => {
    expect(findScriptCarriers('Item', { 'flags.-=itemacro': null, flags: { '-=dae': null } })).toEqual([]);
    expect(paths(findScriptCarriers('Item', { flags: { '==itemacro': { macro: { command: 'x' } } } }))).toEqual([
      'flags.itemacro.macro.command'
    ]);
  });

  it('exempts Midi bookkeeping only as a stored flag, not as an effect change', () => {
    expect(findFlagCarriers('Actor', 'midi-qol', 'actorUuid', 'Actor.abc')).toEqual([]);
    expect(change('flags.midi-qol.actorUuid', 'fetch("x")')).toBe('Midi-QOL runs JavaScript');
  });
});

describe('findScriptCarriers — OverTime specs', () => {
  it.each([
    ['turn=start, damageRoll=1d6, damageType=fire, macro=Burning', 'Midi-QOL runs a macro'],
    ['turn=end, saveAbility=con, saveDC=13, applyCondition=@attributes.hp.value > 0', 'Midi-QOL runs JavaScript'],
    ['turn=end, condition=target.x, damageRoll=1', 'Midi-QOL runs JavaScript'],
    ['turn=end, removeCondition=fetch("x"), damageRoll=1', 'Midi-QOL runs JavaScript'],
    ['turn=end, saveAbility=con, saveDC=(0).constructor.constructor("x")()', 'Midi-QOL runs JavaScript'],
    ['turn=end, saveAbility=con, saveDC=13, saveCount=2-function.MyMod.petrify', 'Midi-QOL runs a macro'],
    ['turn=end, saveAbility=con, saveDC=13, failCount=3+ItemMacro', 'Midi-QOL runs a macro'],
    ['turn=end, saveAbility=con, saveDC=13, saveCount=@flags.world.spec', 'Midi-QOL runs a macro'],
    ['@flags.world.overtime', 'Midi-QOL runs JavaScript']
  ])('%s → %s', (spec, expected) => {
    expect(change('flags.midi-qol.OverTime', spec)).toBe(expected);
    expect(flag('midi-qol', 'OverTime.burning', spec)).toBe(expected);
  });

  it.each([
    'turn=start, damageRoll=1d6, damageType=fire, label=Burning',
    'turn=end, saveAbility=con, saveDC=@attributes.spell.dc, saveDamage=halfdamage, damageRoll=2d6',
    'turn=end, saveAbility=wis|cha, saveDC=8 + @prof + @abilities.wis.mod, saveCount=2c-petrified',
    'turn=end, rollType=check, saveAbility=str, saveDC=15, applyCondition=true, chatFlavor="It burns, it burns"'
  ])('ordinary automation stays writable: %s', spec => {
    expect(findEffectChangeCarriers([{ key: 'flags.midi-qol.OverTime', value: spec, mode: 0 }])).toEqual([]);
  });
});

describe('findScriptCarriers — effect changes', () => {
  it.each([
    ['macro.execute', 'CustomMacro arg', 'DAE runs a macro'],
    ['macro.execute.local', 'CustomMacro', 'DAE runs a macro'],
    ['macro.execute.GM', 'function.MyModule.run', 'DAE runs a macro'],
    ['macro.itemMacro', '', 'DAE runs a macro'],
    ['macro.itemMacro.local', '@item', 'DAE runs a macro'],
    ['macro.itemMacro.GM', '', 'DAE runs a macro'],
    ['macro.activityMacro', '', 'DAE runs a macro'],
    ['macro.createItemRunMacro', 'Compendium.x.y.Item.z', 'DAE runs a macro'],
    ['macro.actorUpdate', '@actorUuid string "[preItemRoll]Boom" flags.midi-qol.onUseMacroName', 'DAE runs a macro'],
    ['macro.actorUpdate', '@actorUuid string "x()" flags.midi-qol.advantage.all', 'DAE runs JavaScript'],
    ['flags.dae.onUpdateTarget', 'origin, t, s, a, flag, MyMacro', 'DAE runs a macro'],
    ['flags.dae.onUpdateSource', 'MyMacro', 'DAE runs a macro'],
    ['flags.midi-qol.onUseMacroName', 'ItemMacro,preActiveEffects', 'Midi-QOL runs a macro'],
    ['flags.midi-qol.advantage.attack.all', 'target.name.includes("Orc")', 'Midi-QOL runs JavaScript'],
    ['flags.dnd5e.DamageBonusMacro', 'ItemMacro', 'Midi-QOL runs a macro'],
    ['flags.dnd5e.weaponCriticalThreshold', '19 - fetch("x")', 'DAE runs JavaScript'],
    ['flags.dnd5e.elvenAccuracy', 'globalThis.x', 'DAE runs JavaScript'],
    ['flags.itemacro.macro.command', 'return 1', 'Item Macro runs a macro'],
    ['flags.dae.macro.command', 'return 1', 'DAE runs a macro'],
    ['system.attributes.ac.bonus', '1 + dae.eval(globalThis.alert(1))', 'DAE runs JavaScript'],
    ['activities[attack].macroData.command', 'return 1', 'Midi-QOL runs a macro'],
    ['system.activities.abc.useConditionText', 'target.x', 'Midi-QOL runs JavaScript']
  ])('%s = %j → %s', (key, value, expected) => {
    expect(change(key, value)).toBe(expected);
  });

  it.each([
    ['flags.midi-qol.advantage.attack.all', '1'],
    ['flags.midi-qol.grants.advantage.attack.all', 1],
    ['flags.midi-qol.disadvantage.ability.save.all', true],
    ['flags.midi-qol.DR.mwak', '3'],
    ['flags.midi-qol.optional.luck.attack.all', '1d4'],
    ['flags.midi-qol.optional.luck.count', 'turn'],
    ['flags.midi-qol.rollModifiers.damage.all.fire', 'min2'],
    ['flags.dae.specialDuration', 'turnStart'],
    ['flags.dnd5e.weaponCriticalThreshold', '19'],
    ['flags.dnd5e.elvenAccuracy', true],
    ['macro.CE', 'Blinded'],
    ['macro.StatusEffect', 'prone'],
    ['macro.tokenMagic', 'glow'],
    ['macro.createItem', 'Compendium.x.y.Item.z'],
    ['macro.actorUpdate', '@actorUuid number "+1" system.attributes.hp.temp'],
    ['macro.actorUpdate', '@actorUuid number 2 flags.midi-qol.advantage.all'],
    ['system.attributes.ac.bonus', '+2'],
    ['system.traits.dr.value', 'fire'],
    ['ATL.light.dim', '20']
  ])('%s = %j stays writable', (key, value) => {
    expect(findEffectChangeCarriers([{ key, value, mode: 2 }])).toEqual([]);
  });

  it('names the change by its place in the list and its key', () => {
    const found = findEffectChangeCarriers([
      { key: 'system.attributes.ac.bonus', value: '1', mode: 2 },
      { key: 'macro.execute', value: 'Boom', mode: 0 }
    ]);
    expect(found).toEqual([
      { path: 'changes.1 (macro.execute)', module: 'DAE', runs: 'a macro', identity: 'change||macro.execute|"Boom"' }
    ]);
  });

  it('reads the Foundry 14 system.changes list and non-string change values', () => {
    const found = findScriptCarriers('ActiveEffect', {
      system: { changes: [{ key: 'flags.midi-qol', value: { onUseMacroName: 'Boom' }, type: 'custom' }] }
    });
    expect(paths(found)).toEqual(['system.changes.0 (flags.midi-qol.onUseMacroName)']);
    expect(paths(findScriptCarriers('ActiveEffect', { 'system.changes': [{ key: 'macro.execute', value: 'x' }] }))).toEqual([
      'system.changes.0 (macro.execute)'
    ]);
  });

  it('reads effect flags that hold code or item data with an item macro', () => {
    const found = findScriptCarriers('ActiveEffect', {
      flags: {
        dae: {
          itemMacro: 'return 1',
          disableCondition: 'x()',
          itemData: { name: 'Sword', flags: { dae: { macro: { command: 'return 2' } } } }
        }
      }
    });
    expect(paths(found)).toEqual([
      'flags.dae.itemMacro',
      'flags.dae.disableCondition',
      'flags.dae.itemData.flags.dae.macro.command'
    ]);
  });

  it('ignores entries that are not changes', () => {
    expect(findEffectChangeCarriers([null, 'macro.execute', { value: 'x' }, { key: 5 }])).toEqual([]);
    expect(findEffectChangeCarriers('macro.execute')).toEqual([]);
  });
});

describe('findScriptCarriers — item system data', () => {
  it.each([
    ['macroData.command', 'return 1', 'Midi-QOL runs a macro'],
    ['useConditionText', 'target.x', 'Midi-QOL runs JavaScript'],
    ['effectConditionText', '@target.details.cr > 2', 'Midi-QOL runs JavaScript'],
    ['midiProperties.triggeredActivityConditionText', 'x()', 'Midi-QOL runs JavaScript'],
    ['overTimeProperties.preRemoveConditionText', 'x()', 'Midi-QOL runs JavaScript'],
    ['overTimeProperties.postRemoveConditionText', 'x()', 'Midi-QOL runs JavaScript']
  ])('system.activities.<id>.%s = %j → %s', (field, value, expected) => {
    const found = findScriptCarriers('Item', { [`system.activities.dnd5eactivity000.${field}`]: value });
    expect(describeCarrier(found[0])).toBe(expected);
  });

  it.each([
    ['macroData.name', 'Blast'],
    ['macroData.command', ''],
    ['useConditionText', ''],
    ['effectConditionText', 'true'],
    ['midiProperties.confirmTargets', 'always'],
    ['damage.parts.0.custom.formula', '2d6 + @mod'],
    ['description', 'Use it when (target.x)']
  ])('system.activities.<id>.%s = %j stays writable', (field, value) => {
    expect(findScriptCarriers('Item', { [`system.activities.a1.${field}`]: value })).toEqual([]);
  });

  it('finds dae.eval in any formula or text of the system data', () => {
    const found = findScriptCarriers('Item', {
      system: { damage: { parts: [['1d6 + dae.eval(x)', 'fire']] }, description: { value: '[[dae.eval(y)]]' } }
    });
    expect(paths(found)).toEqual(['system.damage.parts.0.0', 'system.description.value']);
  });
});

describe('findScriptCarriers — embedded documents', () => {
  it('walks the items and effects of an actor and the effects of its items', () => {
    const found = findScriptCarriers('Actor', {
      name: 'Goblin',
      flags: { 'midi-qol': { onUseMacroName: 'A' } },
      items: [
        { name: 'Bow', flags: { itemacro: { macro: { command: 'x' } } } },
        { name: 'Sword', effects: [{ name: 'Rage', changes: [{ key: 'macro.itemMacro', value: '' }] }] }
      ],
      effects: [{ name: 'Bless', system: { changes: [{ key: 'flags.midi-qol.advantage.all', value: 'x()' }] } }]
    });
    expect(paths(found)).toEqual([
      'flags.midi-qol.onUseMacroName',
      'items.0.flags.itemacro.macro.command',
      'items.1.effects.0.changes.0 (macro.itemMacro)',
      'effects.0.system.changes.0 (flags.midi-qol.advantage.all)'
    ]);
  });

  it('walks the tokens of a scene down to their actor deltas', () => {
    const found = findScriptCarriers('Scene', {
      tokens: [{ name: 'T', delta: { items: [{ name: 'I', system: { activities: { a: { macroData: { command: 'x' } } } } }] } }]
    });
    expect(paths(found)).toEqual(['tokens.0.delta.items.0.system.activities.a.macroData.command']);
  });

  it('reads the flags of embedded cards and pages', () => {
    expect(paths(findScriptCarriers('Cards', { cards: [{ flags: { itemacro: { x: 1 } } }] }))).toEqual([
      'cards.0.flags.itemacro.x'
    ]);
    expect(paths(findScriptCarriers('JournalEntry', { pages: [{ text: { content: '[[dae.eval(1)]]' } }] }))).toEqual([
      'pages.0.text.content'
    ]);
  });

  it('does not treat a change list outside an effect as changes', () => {
    expect(findScriptCarriers('Item', { changes: [{ key: 'macro.execute', value: 'x' }] })).toEqual([]);
  });

  it('finds nothing in data without carriers', () => {
    expect(findScriptCarriers('Actor', { name: 'Goblin', system: { attributes: { hp: { value: 7 } } } })).toEqual([]);
    expect(findScriptCarriers('Actor', null)).toEqual([]);
    expect(findScriptCarriers('Actor', ['flags'])).toEqual([]);
  });
});

describe('introducedScriptCarriers', () => {
  it('lets a stored carrier through unchanged, wherever its change sits in the list', () => {
    const stored = findEffectChangeCarriers([
      { key: 'system.attributes.ac.bonus', value: '1' },
      { key: 'macro.itemMacro', value: '' }
    ]);
    const resent = findEffectChangeCarriers([
      { key: 'macro.itemMacro', value: '' },
      { key: 'system.attributes.ac.bonus', value: '2' }
    ]);
    expect(introducedScriptCarriers(resent, stored)).toEqual([]);
  });

  it('keeps a carrier whose value changed or that is new', () => {
    const stored = findScriptCarriers('Item', { flags: { 'midi-qol': { onUseMacroName: 'A' } } });
    const changed = findScriptCarriers('Item', { 'flags.midi-qol.onUseMacroName': 'B' });
    const same = findScriptCarriers('Item', { 'flags.midi-qol.onUseMacroName': 'A' });
    expect(paths(introducedScriptCarriers(changed, stored))).toEqual(['flags.midi-qol.onUseMacroName']);
    expect(introducedScriptCarriers(same, stored)).toEqual([]);
  });
});
