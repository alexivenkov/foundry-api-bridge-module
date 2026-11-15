/**
 * NOT system-neutral: where third-party automation modules keep data they later run as JavaScript or that makes
 * them run a macro. Verified against the installed DAE 14.0.19, Midi-QOL 14.0.16 (its TypeScript sources from
 * `midi-qol.js.map`) and dnd5e 6.0.6; Item Macro (`itemacro`) is not installed, so its whole flag scope counts.
 * Re-verify after a module update: these are internal data layouts, not public API.
 */

export type AutomationModule = 'DAE' | 'Midi-QOL' | 'Item Macro';

/** What the stored data makes the module do. */
export type CarrierPayload = 'a macro' | 'JavaScript';

export const ITEM_MACRO_SCOPE = 'itemacro';
export const DAE_SCOPE = 'dae';
export const MIDI_SCOPE = 'midi-qol';
export const DND5E_SCOPE = 'dnd5e';

/** DAE `getChangeHandler` prefix-matches its macro keys, so `.local` / `.GM` and any suffix count (`dae.js` registry). */
export const DAE_MACRO_CHANGE_PREFIXES: readonly string[] = ['macro.execute', 'macro.itemMacro', 'macro.activityMacro'];
/** Creates the item and runs its item macro (`GMAction.js` `createActorItem`, `callItemMacro`). */
export const DAE_RUN_ITEM_MACRO_CHANGE = 'macro.createItemRunMacro';
/** A deferred write of any actor field (`daeMacros.js` `macroActorUpdate`). */
export const DAE_ACTOR_UPDATE_CHANGE = 'macro.actorUpdate';
/** Registered as flags and as change keys; each entry names a macro run on actor updates. */
export const DAE_ON_UPDATE_KEYS: ReadonlySet<string> = new Set(['onUpdateTarget', 'onUpdateSource']);
/** `DAESystem.safeEval` of the text (`dae.js` enable / disable conditions). */
export const DAE_CONDITION_KEYS: ReadonlySet<string> = new Set(['enableCondition', 'disableCondition']);
/** Effect flag holding item data whose item macro DAE and Midi-QOL run (`macroResolution.js`). */
export const DAE_ITEM_DATA_KEY = 'itemData';
/**
 * DAE wraps `Roll.replaceFormulaData` and evaluates every `dae.eval(...)` term with `safeEval`, so the marker turns
 * any formula, inline roll or effect change value into JavaScript.
 */
export const DAE_EVAL_MARKER = 'dae.eval(';

/** On-use macros of actors, items and ammunition (`Workflow.callOnUseMacrosForAction`). */
export const MIDI_MACRO_KEYS: ReadonlySet<string> = new Set(['onUseMacroName', 'onUseMacroParts']);
/** `flags.midi-qol.OverTime…` specs (`utils.ts` `parseOvertimeDetails`). */
export const MIDI_OVERTIME_PREFIX = 'OverTime';
/** An activity reference; a custom-mode change is still evaluated by `midiCustomEffect`'s default branch. */
export const MIDI_ACTIVITY_OVERTIME_KEY = 'ActivityOverTime';
export const MIDI_OPTIONAL_KEY = 'optional';
export const MIDI_OPTIONAL_MACRO_KEY = 'macroToCall';
/** `evalCondition` of the optional bonus' activation / force conditions. */
export const MIDI_OPTIONAL_CONDITION_KEYS: ReadonlySet<string> = new Set(['activation', 'force']);
/** Plain values of an optional bonus: a label, a usage count (`getOptionalCountRemaining`), the combat it was used in. */
export const MIDI_OPTIONAL_PLAIN_KEYS: ReadonlySet<string> = new Set(['label', 'count', 'countAlt', 'used']);
/** An optional bonus value with one of these prefixes is called as a macro (`utils.ts` optional bonus dialog). */
export const MIDI_MACRO_SPEC = /^\s*(?:ItemMacro|ActivityMacro|Macro|function)/;
/** Dice modifiers appended to the roll; a custom-mode change is evaluated by `midiCustomEffect`'s default branch. */
export const MIDI_ROLL_MODIFIERS_KEY = 'rollModifiers';

/**
 * Damage reduction keys Midi types (`setupMidiFlagTypes`) or remaps to `system.traits.dm.*` (`dae.addFieldMappings`),
 * so their values are Roll formulas: dnd5e damage, healing and action types plus Midi's own groups.
 */
export const MIDI_FORMULA_DR_SUFFIXES: ReadonlySet<string> = new Set([
  'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic',
  'radiant', 'slashing', 'thunder',
  'healing', 'temphp', 'maximum',
  'mwak', 'rwak', 'msak', 'rsak', 'abil', 'save', 'ench', 'summ', 'heal', 'util', 'other',
  'all', 'non-magical', 'non-magical-physical', 'non-silver', 'non-adamant', 'non-physical', 'non-spell', 'spell',
  'final'
]);
/** Roll formulas under the deferred `grants` group (`Workflow.ts` attack bonus, `MidiActivityMixin` bonus damage). */
export const MIDI_FORMULA_PATHS: readonly (readonly string[])[] = [
  ['grants', 'attack', 'bonus'],
  ['grants', 'bonus', 'damage'],
  ['concentrationSaveBonus']
];
/**
 * Bookkeeping Midi persists itself and never evaluates. Exempt as stored flags only: a custom-mode change on any
 * non-deferred `flags.midi-qol.*` key is evaluated all the same.
 */
export const MIDI_INTERNAL_KEYS: ReadonlySet<string> = new Set([
  'actions', 'transformedActorUuids', 'overtime', 'overtimeChatCardUuids', 'castData', 'actorUuid', 'itemUuid',
  'tokenId', 'tokenUuid', 'sourceActorUuid', 'sourceTokenUuid', 'overtimeActorUuid', 'workflowId', 'undoDamage',
  'ammunitionData', 'regionSourceEffectUuid', 'regionTriggers', 'syntheticItem', 'requestId', 'messageType',
  'rollType', 'type', 'total', 'use', 'isOverTime', 'isConcentrationCheck', 'concentrationRolled',
  'chatMessageShown', 'actionSaveSuccess', 'optionalsUsed', 'playerDamageCard', 'gmHide', 'breakdown',
  'obscureRoll', 'templateElevation', 'anchorToToken', 'inMotion', 'visionSourceHeight', 'visionTargetHeight',
  'evaluated'
]);

/** Damage bonus macros (`Workflow.getDamageBonusMacros`, `DAEdnd5e.daeCustomEffect`). */
export const DND5E_DAMAGE_BONUS_MACRO_KEY = 'DamageBonusMacro';
/**
 * Boolean / number character flags of dnd5e 6.0.6 and the ones Midi adds. DAE evaluates a custom-mode change on them
 * with `safeEval` (`DAEdnd5e.daeCustomEffect`); Midi evaluates two of them as conditions even as stored flags.
 */
export const DND5E_CHARACTER_FLAGS: ReadonlySet<string> = new Set([
  'diamondSoul', 'enhancedDualWielding', 'elvenAccuracy', 'halflingLucky', 'halflingNimbleness',
  'ignoreArmorSpeedReduction', 'initiativeAlert', 'jackOfAllTrades', 'observantFeat', 'tavernBrawlerFeat',
  'powerfulBuild', 'reliableTalent', 'remarkableAthlete', 'toolExpertise', 'weaponCriticalThreshold',
  'spellCriticalThreshold', 'meleeCriticalDamageDice',
  'initiativeHalfProficiency', 'initiativeDisadv', 'spellSniper', 'sharpShooter'
]);
export const DND5E_MIDI_CONDITION_FLAGS: ReadonlySet<string> = new Set(['spellSniper', 'sharpShooter']);

/** The activity macro Midi builds a script Macro from (`MidiActivityMixin.macroData`, `get macro()`). */
export const ACTIVITY_MACRO_PATH: readonly string[] = ['macroData', 'command'];
/** `MidiConditionField`s of an activity, evaluated as use / effect / reaction / trigger / over-time conditions. */
export const ACTIVITY_CONDITION_PATHS: readonly (readonly string[])[] = [
  ['useConditionText'],
  ['effectConditionText'],
  ['midiProperties', 'triggeredActivityConditionText'],
  ['overTimeProperties', 'preRemoveConditionText'],
  ['overTimeProperties', 'postRemoveConditionText']
];

/** OverTime fields (`OVERTIME_KEYS`): the macro to run, conditions evaluated as JavaScript, count actions. */
export const OVERTIME_MACRO_FIELD = 'macro';
export const OVERTIME_CONDITION_FIELDS: readonly string[] = ['applyCondition', 'condition', 'removeCondition'];
export const OVERTIME_SAVE_DC_FIELD = 'saveDC';
/** `saveCount=2-petrified`: the effect spec may be a macro spec (`Hooks.ts` `applyReplacementEffect`). */
export const OVERTIME_COUNT_FIELDS: readonly string[] = ['saveCount', 'failCount', 'saveRemove', 'failRemove'];
export const OVERTIME_REPLACEMENT_MACRO = /function\.|Macro\.|ItemMacro|ActivityMacro|@/;
/** `Roll.safeEval` runs `saveDC` as JavaScript after `@` substitution; plain arithmetic is all a DC needs. */
export const OVERTIME_SAVE_DC_ARITHMETIC = /^(?:\s|\d|\.|[+\-*/()]|@[A-Za-z0-9_.-]+)*$/;
/** A spec that is one `@` reference is substituted before it is split into fields. */
export const OVERTIME_SINGLE_REFERENCE = /^\s*@[\w.-]+\s*$/;

/** A value a condition evaluator reads as itself: a JavaScript literal, never code. */
export const INERT_CONDITION_TEXT = /^\s*(?:true|false|[-+]?\d+(?:\.\d+)?)?\s*$/;
/** Without parentheses, quotes, backticks or operators nothing can be called or assigned. */
export const INERT_REFERENCE_TEXT = /^[A-Za-z0-9_.\-\s]*$/;
export const INERT_MODIFIER_TEXT = /^[A-Za-z0-9<>=\s]*$/;
