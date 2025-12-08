import type { EffectSummary, EffectChangeData, EffectDurationData } from '@/commands/types';

export interface FoundryEffectChange {
  key: string;
  value: string;
  mode: number;
  priority?: number;
}

export interface FoundryEffectDuration {
  startTime?: number;
  seconds?: number;
  rounds?: number;
  turns?: number;
  combat?: string;
  startRound?: number;
  startTurn?: number;
}

export interface FoundryActiveEffect {
  _id: string;
  name: string;
  img: string;
  disabled: boolean;
  origin: string | null;
  transfer: boolean;
  statuses: Set<string>;
  changes: FoundryEffectChange[];
  duration: FoundryEffectDuration;
  flags: Record<string, unknown>;
  update(data: Record<string, unknown>): Promise<FoundryActiveEffect>;
  delete(): Promise<FoundryActiveEffect>;
}

export interface FoundryEffectsCollection {
  contents: FoundryActiveEffect[];
  get(id: string): FoundryActiveEffect | undefined;
}

export interface EffectFoundryActor {
  id: string;
  name: string;
  effects: FoundryEffectsCollection;
  statuses: Set<string>;
  toggleStatusEffect(
    statusId: string,
    options?: { active?: boolean; overlay?: boolean }
  ): Promise<FoundryActiveEffect | boolean | undefined>;
  createEmbeddedDocuments(
    type: 'ActiveEffect',
    data: ActiveEffectCreateData[]
  ): Promise<FoundryActiveEffect[] | null>;
}

export interface ActiveEffectCreateData {
  name: string;
  img?: string;
  disabled?: boolean;
  origin?: string;
  statuses?: string[];
  changes?: EffectChangeData[];
  duration?: EffectDurationData;
}

export interface EffectActorsCollection {
  get(id: string): EffectFoundryActor | undefined;
}

export interface EffectFoundryGame {
  actors: EffectActorsCollection;
}

export function getGame(): EffectFoundryGame {
  return (globalThis as unknown as { game: EffectFoundryGame }).game;
}

export function mapEffectToSummary(effect: FoundryActiveEffect): EffectSummary {
  const isTemporary =
    effect.duration.rounds !== undefined ||
    effect.duration.turns !== undefined ||
    effect.duration.seconds !== undefined;

  const summary: EffectSummary = {
    id: effect._id,
    name: effect.name,
    img: effect.img,
    disabled: effect.disabled,
    isTemporary,
    statuses: Array.from(effect.statuses),
    origin: effect.origin
  };

  if (effect.changes.length > 0) {
    summary.changes = effect.changes.map(c => ({
      key: c.key,
      value: c.value,
      mode: c.mode
    }));
  }

  if (isTemporary) {
    const duration: EffectDurationData = {};
    if (effect.duration.rounds !== undefined) {
      duration.rounds = effect.duration.rounds;
    }
    if (effect.duration.turns !== undefined) {
      duration.turns = effect.duration.turns;
    }
    if (effect.duration.seconds !== undefined) {
      duration.seconds = effect.duration.seconds;
    }
    summary.duration = duration;
  }

  return summary;
}