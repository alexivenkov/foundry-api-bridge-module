export interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

export interface FoundryRoll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical?: boolean;
  isFumble?: boolean;
}

export interface ActivityConsumeConfig {
  resources?: boolean;
  spellSlot?: boolean;
  action?: boolean;
}

export interface ActivityUsageConfig {
  consume?: ActivityConsumeConfig | false;
  scaling?: number | false;
  concentration?: { begin?: boolean };
  create?: { measuredTemplate?: boolean };
  event?: { shiftKey?: boolean };
  spell?: { slot: string };
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
}

export interface FoundryItemsCollection {
  get(id: string): FoundryItem | undefined;
}

export interface FoundryItemActionActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
}

export interface FoundryItemActionActorsCollection {
  get(id: string): FoundryItemActionActor | undefined;
}

export interface FoundryItemActionGame {
  actors: FoundryItemActionActorsCollection;
}

export interface FoundryTargetToken {
  setTarget(targeted: boolean, options?: { user?: FoundryUser; releaseOthers?: boolean }): void;
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

export interface MidiWorkflow {
  attackTotal?: number;
  damageTotal?: number;
  isCritical?: boolean;
  isFumble?: boolean;
  hitTargets?: Set<MidiWorkflowToken>;
  saves?: Set<MidiWorkflowToken>;
  failedSaves?: Set<MidiWorkflowToken>;
}

export interface FoundryHooks {
  once(hook: string, callback: (workflow: MidiWorkflow) => void): number;
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

export function isMidiQolActive(): boolean {
  return getGame().modules.get('midi-qol')?.active ?? false;
}
