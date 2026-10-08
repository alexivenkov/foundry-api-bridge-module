export interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number; active?: boolean }>;
}

export interface FoundryRoll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical?: boolean;
  isFumble?: boolean;
  options?: { advantageMode?: number };
}

export interface ActivityConsumeConfig {
  resources?: boolean | number[];
  spellSlot?: boolean;
  action?: boolean;
}

/** dnd5e keybinding surrogate: Shift skips the roll dialogs of the subsequent rolls. */
export interface ActivityUsageEvent {
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/**
 * Midi-QOL reads `usage.midiOptions` in `MidiActivityMixin#use` and spreads
 * `workflowOptions` onto the workflow (verified against midi-qol 14.0.13).
 */
export interface MidiWorkflowOptions {
  advantage?: boolean;
  disadvantage?: boolean;
  attackMode?: string;
  autoFastAttack?: boolean;
  fastForwardAttack?: boolean;
  fastForwardDamage?: boolean;
  autoRollAttack?: boolean;
  autoRollDamage?: 'none' | 'always' | 'saveOnly' | 'onHit';
  targetConfirmation?: 'none' | 'never' | 'always';
}

export interface MidiUsageOptions {
  configureDialog?: boolean;
  workflowOptions?: MidiWorkflowOptions;
}

export interface ActivityUsageConfig {
  consume?: ActivityConsumeConfig | false;
  scaling?: number | false;
  concentration?: { begin?: boolean };
  create?: { measuredTemplate?: boolean };
  event?: ActivityUsageEvent;
  spell?: { slot: string };
  midiOptions?: MidiUsageOptions;
}

export interface ActivityDialogConfig {
  configure?: boolean;
}

export interface ActivityMessageConfig {
  create?: boolean;
}

export interface FoundryChatMessage {
  id: string;
}

export interface FoundryUsageResult {
  rolls?: FoundryRoll[];
  message?: FoundryChatMessage;
}

export interface FoundryActivity {
  _id: string;
  name: string;
  type: string;
  target?: { affects?: { type?: string } };
  use(
    usage?: ActivityUsageConfig,
    dialog?: ActivityDialogConfig,
    message?: ActivityMessageConfig
  ): Promise<FoundryUsageResult | null>;
}

export interface FoundryActivitiesCollection {
  contents: FoundryActivity[];
  get(id: string): FoundryActivity | undefined;
  find(predicate: (activity: FoundryActivity) => boolean): FoundryActivity | undefined;
}

export interface FoundryItemSystem {
  activities?: FoundryActivitiesCollection;
  quantity?: number;
  uses?: { autoDestroy?: boolean };
}

export interface FoundryItem {
  id: string;
  name: string;
  type: string;
  system: FoundryItemSystem;
  use(
    usage?: ActivityUsageConfig,
    dialog?: ActivityDialogConfig,
    message?: ActivityMessageConfig
  ): Promise<FoundryUsageResult | null>;
  displayCard(message?: ActivityMessageConfig): Promise<FoundryChatMessage | null>;
  delete?(): Promise<unknown>;
}

export interface FoundryItemsCollection {
  get(id: string): FoundryItem | undefined;
}

export interface FoundryHitPoints {
  value: number;
  max: number;
  temp: number | null;
}

export interface FoundryItemActionActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
  system?: { attributes?: { hp?: FoundryHitPoints } };
  getActiveTokens?(): Array<{ id: string }>;
  applyDamage?(damages: Array<{ value: number; type?: string }>, options?: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryItemActionActorsCollection {
  get(id: string): FoundryItemActionActor | undefined;
}

export interface FoundryItemActionGame {
  actors: FoundryItemActionActorsCollection;
}

export interface FoundryTargetToken {
  id?: string;
  actor?: FoundryItemActionActor | null;
  setTarget(targeted: boolean, options?: { user?: FoundryUser; releaseOthers?: boolean }): void;
  control?(options?: { releaseOthers?: boolean }): void;
}

export interface FoundryUser {
  id: string;
  targets: Set<FoundryTargetToken>;
}

export interface FoundryCanvasTokensLayer {
  get(id: string): FoundryTargetToken | undefined;
}

export interface FoundryCanvasScene {
  createEmbeddedDocuments(type: string, data: Record<string, unknown>[]): Promise<unknown[]>;
}

export interface FoundryCanvas {
  tokens: FoundryCanvasTokensLayer;
  scene: FoundryCanvasScene | undefined;
}

export interface FoundryModule {
  active: boolean;
}

export interface FoundryModulesCollection {
  get(id: string): FoundryModule | undefined;
}

export interface MidiWorkflowToken {
  id: string;
}

/** One entry of `workflow.damageList` (midi-qol `setupDamageDetails`). */
export interface MidiDamageListEntry {
  targetUuid?: string;
  tokenUuid?: string;
  actorId?: string;
  actorUuid?: string;
  oldHP?: number;
  newHP?: number;
  oldTempHP?: number;
  newTempHP?: number;
  hpDamage?: number;
  totalDamage?: number;
  wasHit?: boolean;
}

export interface MidiWorkflow {
  attackTotal?: number;
  damageTotal?: number;
  isCritical?: boolean;
  isFumble?: boolean;
  hitTargets?: Set<MidiWorkflowToken>;
  saves?: Set<MidiWorkflowToken>;
  failedSaves?: Set<MidiWorkflowToken>;
  damageList?: MidiDamageListEntry[];
  activity?: { id?: string; _id?: string };
  item?: { id?: string };
  targets?: Set<{ actor?: { uuid?: string } | null }>;
  targetACModifiers?: Map<string, number>;
}

/** dnd5e roll process config as seen by the `dnd5e.preRoll*V2` hooks. */
export interface D20ProcessConfig {
  subject?: { id?: string; _id?: string };
  advantage?: boolean;
  disadvantage?: boolean;
  attackMode?: string;
  ammunition?: string | false;
  rolls?: Array<{ parts?: string[]; options?: Record<string, unknown> }>;
}

export interface RollDialogHookConfig {
  configure?: boolean;
}

/** Fourth argument of `dnd5e.activityConsumption`, before the updates are applied. */
export interface ConsumptionUpdates {
  delete?: string[];
  item?: Array<Record<string, unknown>>;
}

export type HookCallback = (...args: never[]) => unknown;

export interface FoundryHooks {
  on(hook: string, callback: HookCallback): number;
  once(hook: string, callback: HookCallback): number;
  off(hook: string, id: number): void;
}

export interface AbilityTemplateClass {
  prototype: { drawPreview: () => Promise<unknown> };
}

export interface Dnd5eCanvas {
  AbilityTemplate: AbilityTemplateClass;
}

export interface FoundryActivationGame {
  actors: FoundryItemActionActorsCollection;
  user: FoundryUser;
  modules: FoundryModulesCollection;
}

export function getGame(): FoundryActivationGame {
  return (globalThis as unknown as { game: FoundryActivationGame }).game;
}

export function getCanvas(): FoundryCanvas {
  return (globalThis as unknown as { canvas: FoundryCanvas }).canvas;
}

export function getHooks(): FoundryHooks {
  return (globalThis as unknown as { Hooks: FoundryHooks }).Hooks;
}

export function getDnd5eCanvas(): Dnd5eCanvas | undefined {
  return (globalThis as unknown as { dnd5e?: { canvas: Dnd5eCanvas } }).dnd5e?.canvas;
}

export type FromUuidSync = (uuid: string) => { actor?: { system?: { attributes?: { hp?: FoundryHitPoints } } } | null } | null;

export function getFromUuidSync(): FromUuidSync | undefined {
  return (globalThis as unknown as { fromUuidSync?: FromUuidSync }).fromUuidSync;
}

export function isMidiQolActive(): boolean {
  return getGame().modules.get('midi-qol')?.active ?? false;
}
