import {
  ACTIVITY_CONDITION_PATHS,
  ACTIVITY_MACRO_PATH,
  DAE_ACTOR_UPDATE_CHANGE,
  DAE_CONDITION_KEYS,
  DAE_EVAL_MARKER,
  DAE_ITEM_DATA_KEY,
  DAE_MACRO_CHANGE_PREFIXES,
  DAE_ON_UPDATE_KEYS,
  DAE_RUN_ITEM_MACRO_CHANGE,
  DAE_SCOPE,
  DND5E_CHARACTER_FLAGS,
  DND5E_DAMAGE_BONUS_MACRO_KEY,
  DND5E_MIDI_CONDITION_FLAGS,
  DND5E_SCOPE,
  INERT_CONDITION_TEXT,
  INERT_MODIFIER_TEXT,
  INERT_REFERENCE_TEXT,
  ITEM_MACRO_SCOPE,
  MIDI_ACTIVITY_OVERTIME_KEY,
  MIDI_FORMULA_DR_SUFFIXES,
  MIDI_FORMULA_PATHS,
  MIDI_INTERNAL_KEYS,
  MIDI_MACRO_KEYS,
  MIDI_MACRO_SPEC,
  MIDI_OPTIONAL_CONDITION_KEYS,
  MIDI_OPTIONAL_KEY,
  MIDI_OPTIONAL_MACRO_KEY,
  MIDI_OPTIONAL_PLAIN_KEYS,
  MIDI_OVERTIME_PREFIX,
  MIDI_ROLL_MODIFIERS_KEY,
  MIDI_SCOPE,
  OVERTIME_CONDITION_FIELDS,
  OVERTIME_COUNT_FIELDS,
  OVERTIME_MACRO_FIELD,
  OVERTIME_REPLACEMENT_MACRO,
  OVERTIME_SAVE_DC_ARITHMETIC,
  OVERTIME_SAVE_DC_FIELD,
  OVERTIME_SINGLE_REFERENCE,
  type AutomationModule,
  type CarrierPayload
} from './automationCatalogue';
import { splitOverTimeSpec } from './overTimeSpec';

/** Stored data that DAE, Midi-QOL or Item Macro will later run as JavaScript, or that makes them run a macro. */
export interface ScriptCarrier {
  /** Where the caller put it, e.g. `flags.midi-qol.onUseMacroName` or `changes.0 (macro.execute)`. */
  readonly path: string;
  readonly module: AutomationModule;
  readonly runs: CarrierPayload;
  /** Equal for the same carrier holding the same value, wherever a change list put it. */
  readonly identity: string;
}

type Origin = 'document' | 'change';

interface Verdict {
  readonly module: AutomationModule;
  readonly runs: CarrierPayload;
}

interface LeafHit extends Verdict {
  readonly path: string;
  readonly value: unknown;
}

const EMBEDDED_DOCUMENTS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  Actor: { items: 'Item', effects: 'ActiveEffect' },
  Item: { effects: 'ActiveEffect' },
  Scene: { tokens: 'Token' },
  Token: { delta: 'Actor', actorData: 'Actor' },
  Cards: { cards: 'Card' },
  JournalEntry: { pages: 'JournalEntryPage' },
  RollTable: { results: 'TableResult' },
  Playlist: { sounds: 'PlaylistSound' }
};

const ACTIVITY_CHANGE_KEY = /^activities\[([^\]]*)\]\.?(.*)$/;
const CHANGE_LIST_PATHS: readonly (readonly string[])[] = [['changes'], ['system', 'changes']];
const UPDATE_TOKENS = /"([^"]*)"|'([^']*)'|(\S+)/g;
/** What a string-typed `macro.actorUpdate` may write: assume code. */
const WORST_CASE_TEXT = 'code()';

const DAE_MACRO: Verdict = { module: 'DAE', runs: 'a macro' };
const DAE_SCRIPT: Verdict = { module: 'DAE', runs: 'JavaScript' };
const MIDI_MACRO: Verdict = { module: 'Midi-QOL', runs: 'a macro' };
const MIDI_SCRIPT: Verdict = { module: 'Midi-QOL', runs: 'JavaScript' };
const ITEM_MACRO: Verdict = { module: 'Item Macro', runs: 'a macro' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function samePath(path: readonly string[], expected: readonly string[]): boolean {
  return path.length === expected.length && expected.every((segment, index) => path[index] === segment);
}

function startsWithPath(path: readonly string[], prefix: readonly string[]): boolean {
  return path.length >= prefix.length && prefix.every((segment, index) => path[index] === segment);
}

/** A dotted key the core expands; `==` replaces, a `-=` segment deletes, which stores nothing. */
function keySegments(rawKey: string): string[] | null {
  const segments = rawKey.split('.').map(segment => (segment.startsWith('==') ? segment.slice(2) : segment));
  return segments.some(segment => segment.startsWith('-=')) ? null : segments;
}

function holdsSomething(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function isInertCondition(value: unknown): boolean {
  if (typeof value === 'string') {
    return INERT_CONDITION_TEXT.test(value);
  }
  return value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number';
}

function textOutside(pattern: RegExp, value: unknown): boolean {
  return typeof value === 'string' && !pattern.test(value);
}

function condition(value: unknown, verdict: Verdict): Verdict | null {
  return isInertCondition(value) ? null : verdict;
}

function overTimeVerdict(value: unknown): Verdict | null {
  if (typeof value !== 'string') {
    return isInertCondition(value) ? null : MIDI_SCRIPT;
  }
  if (OVERTIME_SINGLE_REFERENCE.test(value)) {
    return MIDI_SCRIPT;
  }
  const fields = splitOverTimeSpec(value);
  if (holdsSomething(fields[OVERTIME_MACRO_FIELD])) {
    return MIDI_MACRO;
  }
  if (OVERTIME_CONDITION_FIELDS.some(field => !isInertCondition(fields[field]))) {
    return MIDI_SCRIPT;
  }
  const saveDc = fields[OVERTIME_SAVE_DC_FIELD];
  if (saveDc !== undefined && !OVERTIME_SAVE_DC_ARITHMETIC.test(saveDc)) {
    return MIDI_SCRIPT;
  }
  const countField = OVERTIME_COUNT_FIELDS.find(field => OVERTIME_REPLACEMENT_MACRO.test(fields[field] ?? ''));
  return countField !== undefined ? MIDI_MACRO : null;
}

function midiVerdict(rest: readonly string[], value: unknown, origin: Origin): Verdict | null {
  const [key, name, sub] = rest;
  if (key === undefined) {
    return null;
  }
  if (MIDI_MACRO_KEYS.has(key)) {
    return holdsSomething(value) ? MIDI_MACRO : null;
  }
  if (key.startsWith(MIDI_OVERTIME_PREFIX)) {
    return overTimeVerdict(value);
  }
  if (key === MIDI_ACTIVITY_OVERTIME_KEY) {
    return textOutside(INERT_REFERENCE_TEXT, value) ? MIDI_SCRIPT : null;
  }
  if (key === MIDI_OPTIONAL_KEY) {
    if (name === undefined || sub === undefined || MIDI_OPTIONAL_PLAIN_KEYS.has(sub)) {
      return null;
    }
    if (sub === MIDI_OPTIONAL_MACRO_KEY) {
      return holdsSomething(value) ? MIDI_MACRO : null;
    }
    if (MIDI_OPTIONAL_CONDITION_KEYS.has(sub)) {
      return condition(value, MIDI_SCRIPT);
    }
    return typeof value === 'string' && MIDI_MACRO_SPEC.test(value) ? MIDI_MACRO : null;
  }
  if (key === 'DR' && rest.length === 2 && name !== undefined && MIDI_FORMULA_DR_SUFFIXES.has(name)) {
    return null;
  }
  if (MIDI_FORMULA_PATHS.some(formula => startsWithPath(rest, formula))) {
    return null;
  }
  if (key === MIDI_ROLL_MODIFIERS_KEY) {
    return textOutside(INERT_MODIFIER_TEXT, value) ? MIDI_SCRIPT : null;
  }
  if (origin === 'document' && MIDI_INTERNAL_KEYS.has(key)) {
    return null;
  }
  return condition(value, MIDI_SCRIPT);
}

function daeVerdict(rest: readonly string[], value: unknown): Verdict | null {
  const [key, sub] = rest;
  if (key === 'macro' && sub === 'command') {
    return holdsSomething(value) ? DAE_MACRO : null;
  }
  if (key === 'itemMacro' || (key !== undefined && DAE_ON_UPDATE_KEYS.has(key))) {
    return holdsSomething(value) ? DAE_MACRO : null;
  }
  if (key !== undefined && DAE_CONDITION_KEYS.has(key)) {
    return condition(value, DAE_SCRIPT);
  }
  return null;
}

function dnd5eVerdict(rest: readonly string[], value: unknown, origin: Origin): Verdict | null {
  if (rest[0] === DND5E_DAMAGE_BONUS_MACRO_KEY) {
    return holdsSomething(value) ? MIDI_MACRO : null;
  }
  const flag = rest[rest.length - 1];
  if (flag === undefined || !DND5E_CHARACTER_FLAGS.has(flag)) {
    return null;
  }
  if (DND5E_MIDI_CONDITION_FLAGS.has(flag)) {
    return condition(value, MIDI_SCRIPT);
  }
  return origin === 'change' ? condition(value, DAE_SCRIPT) : null;
}

function flagVerdict(segments: readonly string[], value: unknown, origin: Origin): Verdict | null {
  const [scope, ...rest] = segments;
  switch (scope) {
    case ITEM_MACRO_SCOPE:
      return holdsSomething(value) ? ITEM_MACRO : null;
    case DAE_SCOPE:
      return daeVerdict(rest, value);
    case MIDI_SCOPE:
      return midiVerdict(rest, value, origin);
    case DND5E_SCOPE:
      return dnd5eVerdict(rest, value, origin);
    default:
      return null;
  }
}

function activityVerdict(rest: readonly string[], value: unknown): Verdict | null {
  if (samePath(rest, ACTIVITY_MACRO_PATH)) {
    return holdsSomething(value) ? MIDI_MACRO : null;
  }
  return ACTIVITY_CONDITION_PATHS.some(conditionPath => samePath(rest, conditionPath))
    ? condition(value, MIDI_SCRIPT)
    : null;
}

function leafVerdict(path: readonly string[], value: unknown, origin: Origin): Verdict | null {
  if (typeof value === 'string' && value.includes(DAE_EVAL_MARKER)) {
    return DAE_SCRIPT;
  }
  if (path[0] === 'flags') {
    return flagVerdict(path.slice(1), value, origin);
  }
  if (path[0] === 'system' && path[1] === 'activities' && path.length > 3) {
    return activityVerdict(path.slice(3), value);
  }
  return null;
}

function leafHits(path: readonly string[], value: unknown, origin: Origin): LeafHit[] {
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([rawKey, nested]) => {
      const segments = keySegments(rawKey);
      return segments === null ? [] : leafHits([...path, ...segments], nested, origin);
    });
  }
  if (Array.isArray(value)) {
    return value.flatMap((nested, index) => leafHits([...path, String(index)], nested, origin));
  }
  const verdict = leafVerdict(path, value, origin);
  return verdict === null ? [] : [{ ...verdict, path: path.join('.'), value }];
}

/** `activities[attack].x` is dnd5e's change key for a field of every attack activity of the item. */
function changeKeySegments(key: string): string[] {
  const activity = ACTIVITY_CHANGE_KEY.exec(key);
  if (activity === null) {
    return key.split('.');
  }
  const [, activityId = '', rest = ''] = activity;
  return ['system', 'activities', activityId, ...(rest === '' ? [] : rest.split('.'))];
}

function updateTokens(value: string): string[] {
  return [...value.matchAll(UPDATE_TOKENS)].map(match => match[1] ?? match[2] ?? match[3] ?? '');
}

/** `macro.actorUpdate <actor> <type> <expression> <field> [undo]`: refused when the field it writes is a carrier. */
function actorUpdateHits(key: string, value: unknown): LeafHit[] {
  if (typeof value !== 'string') {
    return [];
  }
  if (value.includes(DAE_EVAL_MARKER)) {
    return [{ ...DAE_SCRIPT, path: key, value }];
  }
  const tokens = updateTokens(value);
  const written = tokens[1] === 'number' || tokens[1] === 'boolean' ? 0 : WORST_CASE_TEXT;
  for (const token of tokens) {
    const verdict = token.includes('.') ? leafVerdict(changeKeySegments(token), written, 'change') : null;
    if (verdict !== null) {
      return [{ module: 'DAE', runs: verdict.runs, path: key, value }];
    }
  }
  return [];
}

function isDaeMacroChange(key: string): boolean {
  return DAE_MACRO_CHANGE_PREFIXES.some(prefix => key.startsWith(prefix)) || key === DAE_RUN_ITEM_MACRO_CHANGE;
}

/** A change writes its value at its key on the actor or item the effect applies to. */
function changeHits(key: string, value: unknown): LeafHit[] {
  if (isDaeMacroChange(key)) {
    return [{ ...DAE_MACRO, path: key, value }];
  }
  if (key === DAE_ACTOR_UPDATE_CHANGE) {
    return actorUpdateHits(key, value);
  }
  return leafHits(changeKeySegments(key), value, 'change');
}

function stableValue(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

class CarrierScanner {
  readonly found: ScriptCarrier[] = [];

  document(documentType: string, data: unknown, prefix: readonly string[]): void {
    if (!isRecord(data)) {
      return;
    }
    for (const [rawKey, value] of Object.entries(data)) {
      const segments = keySegments(rawKey);
      if (segments !== null) {
        this.visit(documentType, prefix, segments, value);
      }
    }
  }

  private visit(documentType: string, prefix: readonly string[], path: readonly string[], value: unknown): void {
    const [first] = path;
    const embeddedType = path.length === 1 && first !== undefined ? EMBEDDED_DOCUMENTS[documentType]?.[first] : undefined;
    if (embeddedType !== undefined) {
      this.embedded(embeddedType, [...prefix, ...path], value);
      return;
    }
    if (documentType === 'ActiveEffect' && Array.isArray(value) && CHANGE_LIST_PATHS.some(list => samePath(path, list))) {
      this.changes(prefix, path, value);
      return;
    }
    if (samePath(path, ['flags', DAE_SCOPE, DAE_ITEM_DATA_KEY]) && isRecord(value)) {
      this.document('Item', value, [...prefix, ...path]);
      return;
    }
    if (isRecord(value)) {
      for (const [rawKey, nested] of Object.entries(value)) {
        const segments = keySegments(rawKey);
        if (segments !== null) {
          this.visit(documentType, prefix, [...path, ...segments], nested);
        }
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((nested, index) => {
        this.visit(documentType, prefix, [...path, String(index)], nested);
      });
      return;
    }
    const verdict = leafVerdict(path, value, 'document');
    if (verdict !== null) {
      const where = [...prefix, ...path].join('.');
      this.found.push({ ...verdict, path: where, identity: `${where}|${stableValue(value)}` });
    }
  }

  private embedded(documentType: string, at: readonly string[], value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        this.document(documentType, entry, [...at, String(index)]);
      });
    } else {
      this.document(documentType, value, at);
    }
  }

  private changes(prefix: readonly string[], listPath: readonly string[], list: readonly unknown[]): void {
    const owner = prefix.join('.');
    list.forEach((entry, index) => {
      if (!isRecord(entry) || typeof entry['key'] !== 'string') {
        return;
      }
      const where = [...prefix, ...listPath, String(index)].join('.');
      for (const hit of changeHits(entry['key'].trim(), entry['value'])) {
        this.found.push({
          module: hit.module,
          runs: hit.runs,
          path: `${where} (${hit.path})`,
          identity: `change|${owner}|${hit.path}|${stableValue(hit.value)}`
        });
      }
    });
  }
}

/**
 * The carriers in document-shaped data of `documentType` (`Actor`, `Item`, `ActiveEffect`, `Scene`, …): create
 * data or update changes, nested objects and dot-notation keys alike, embedded items / effects / tokens included.
 */
export function findScriptCarriers(documentType: string, data: unknown): ScriptCarrier[] {
  const scanner = new CarrierScanner();
  scanner.document(documentType, data, []);
  return scanner.found;
}

/** One flag write: `scope` and a dotted `key` as `Document#setFlag` takes them. */
export function findFlagCarriers(documentType: string, scope: string, key: string, value: unknown): ScriptCarrier[] {
  return findScriptCarriers(documentType, { flags: { [scope]: { [key]: value } } });
}

/** An effect change list, in the Foundry 13 (`changes`) or 14 (`system.changes`) place alike. */
export function findEffectChangeCarriers(changes: unknown): ScriptCarrier[] {
  return findScriptCarriers('ActiveEffect', { changes });
}

/** What a write adds: a carrier the document already holds with the same value stays editable. */
export function introducedScriptCarriers(
  found: readonly ScriptCarrier[],
  stored: readonly ScriptCarrier[]
): ScriptCarrier[] {
  const kept = new Set(stored.map(carrier => carrier.identity));
  return found.filter(carrier => !kept.has(carrier.identity));
}
