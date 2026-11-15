import type { FoundryScenesGame } from '@/core/shared';

/** `type` is a StringField without an initial value: unset until chosen, `''` once cleared by the core form. */
export interface FoundryAmbientSoundEffect {
  type?: string | undefined;
  intensity: number;
}

/**
 * The AmbientSound document fields the context reads and writes
 * (`BaseAmbientSound`, Foundry 13–14). `name`, `locked` and `levels` (a Set of
 * Level ids) exist from 14 on, `elevation` and `effects` from 12 on.
 */
export interface FoundryAmbientSoundDocument {
  id: string;
  name?: string | undefined;
  x: number;
  y: number;
  elevation?: number | undefined;
  levels?: Iterable<string> | undefined;
  radius: number;
  path: string | null;
  repeat: boolean;
  volume: number;
  walls: boolean;
  easing: boolean;
  hidden: boolean;
  locked?: boolean | undefined;
  darkness: {
    min: number;
    max: number;
  };
  effects?:
    | {
        base: FoundryAmbientSoundEffect;
        muffled: FoundryAmbientSoundEffect;
      }
    | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryAmbientSoundsCollection {
  get(id: string): FoundryAmbientSoundDocument | undefined;
  contents: FoundryAmbientSoundDocument[];
}

/** `Scene#levels`, the embedded Level documents of Foundry 14. */
export interface FoundrySoundSceneLevelsCollection {
  contents: Array<{ id: string }>;
}

export interface FoundryAmbientSoundScene {
  id: string;
  sounds: FoundryAmbientSoundsCollection;
  levels?: FoundrySoundSceneLevelsCollection | undefined;
  createEmbeddedDocuments(
    type: 'AmbientSound',
    data: Record<string, unknown>[]
  ): Promise<FoundryAmbientSoundDocument[]>;
  deleteEmbeddedDocuments(type: 'AmbientSound', ids: string[]): Promise<unknown[]>;
}

export type FoundryAmbientSoundGame = FoundryScenesGame<FoundryAmbientSoundScene>;
