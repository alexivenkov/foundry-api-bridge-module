export interface SoundEffectSpec {
  readonly type: string;
  /** Left to the core default (5) when undefined. */
  readonly intensity: number | undefined;
}

/** A one-shot sound at a point of the canvas, heard by every client according to its own listeners. */
export interface PositionalSound {
  readonly src: string;
  readonly x: number;
  readonly y: number;
  /** Left to the core default when undefined: 0, or the viewed level's base elevation on Foundry 14. */
  readonly elevation: number | undefined;
  readonly radius: number;
  readonly volume: number;
  readonly easing: boolean;
  readonly walls: boolean;
  readonly gmAlways: boolean;
  readonly baseEffect: SoundEffectSpec | undefined;
  readonly muffledEffect: SoundEffectSpec | undefined;
}

/** `Sound#playAtPosition` defaults, Foundry 13.351 and 14.368. */
export const POSITIONAL_SOUND_DEFAULTS = {
  volume: 1,
  easing: true,
  walls: true,
  gmAlways: true
} as const;

/** What the GM's own browser did with a broadcast; the other clients were asked in every case. */
export type SoundBroadcastGmState = 'done' | 'inaudible' | 'deferred' | 'failed';

export type SoundPreloadGmState = Exclude<SoundBroadcastGmState, 'inaudible'>;
