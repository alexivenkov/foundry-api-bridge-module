import type { RollResult } from '@/commands/types';

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
}

export interface ActivityDialogConfig {
  configure?: boolean;
}

export interface ActivityMessageConfig {
  create?: boolean;
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
  uses?: { value: number; max: number; per: string };
  quantity?: number;
  equipped?: boolean;
  attunement?: number;
  identified?: boolean;
  description?: { value?: string };
  damage?: Record<string, unknown>;
  range?: Record<string, unknown>;
}

export interface FoundryChatMessage {
  id: string;
}

export interface FoundryUsageResult {
  rolls?: FoundryRoll[];
  message?: FoundryChatMessage;
}

export interface FoundryItem {
  id: string;
  name: string;
  type: string;
  img: string;
  system: FoundryItemSystem;
  use(
    usage?: { consume?: boolean; scaling?: number; create?: { measuredTemplate?: boolean } },
    dialog?: { configure?: boolean },
    message?: { create?: boolean }
  ): Promise<FoundryUsageResult | null>;
  displayCard(message?: { create?: boolean }): Promise<FoundryChatMessage | null>;
}

export interface FoundryItemsCollection {
  contents: FoundryItem[];
  get(id: string): FoundryItem | undefined;
}

export interface FoundryActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
}

export interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

export interface FoundryTargetToken {
  setTarget(targeted: boolean, options?: { user?: FoundryUser; releaseOthers?: boolean }): void;
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

export interface FoundryUser {
  id: string;
  targets: Set<FoundryTargetToken>;
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

export interface ItemFoundryGame {
  actors: ActorsCollection;
  user: FoundryUser;
  modules: FoundryModulesCollection;
}

export function getGame(): ItemFoundryGame {
  return (globalThis as unknown as { game: ItemFoundryGame }).game;
}

export function getCanvas(): FoundryCanvas {
  return (globalThis as unknown as { canvas: FoundryCanvas }).canvas;
}

export function getHooks(): FoundryHooks {
  return (globalThis as unknown as { Hooks: FoundryHooks }).Hooks;
}

export function isMidiQolActive(): boolean {
  return getGame().modules.get('midi-qol')?.active ?? false;
}

export interface AbilityTemplateDocument {
  toObject(): Record<string, unknown>;
  updateSource(data: Record<string, unknown>): void;
}

export interface AbilityTemplateInstance {
  document: AbilityTemplateDocument;
  drawPreview(): Promise<unknown>;
}

export interface AbilityTemplateClass {
  fromActivity(activity: FoundryActivity): AbilityTemplateInstance[];
  prototype: { drawPreview: () => Promise<unknown> };
}

export interface Dnd5eCanvas {
  AbilityTemplate: AbilityTemplateClass;
}

export function getDnd5eCanvas(): Dnd5eCanvas | undefined {
  return (globalThis as unknown as { dnd5e?: { canvas: Dnd5eCanvas } }).dnd5e?.canvas;
}

export function extractDiceResults(terms: FoundryDiceTerm[]): RollResult['dice'] {
  const diceResults: RollResult['dice'] = [];

  for (const term of terms) {
    if (term.faces !== undefined && term.results !== undefined) {
      diceResults.push({
        type: `d${String(term.faces)}`,
        count: term.number ?? 1,
        results: term.results.map(r => r.result)
      });
    }
  }

  return diceResults;
}