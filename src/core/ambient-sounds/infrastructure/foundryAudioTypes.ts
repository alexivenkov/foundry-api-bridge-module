/** A core `Sound`; `failed` is true once its file could not be loaded. */
export interface FoundrySoundLike {
  readonly failed?: boolean | undefined;
}

export interface FoundrySoundOrigin {
  x: number;
  y: number;
  elevation?: number;
}

/**
 * `SoundsLayer#emitAtPosition(src, origin, radius, options)` (Foundry 13.351 /
 * 14.368): emits `playAudioPosition` with these arguments to the other clients
 * synchronously, then plays locally and resolves to the played Sound, or null
 * when this client is out of earshot. The local playback first waits for the
 * browser's audio unlock (the user's first gesture).
 */
export interface FoundrySoundsLayer {
  emitAtPosition(
    src: string,
    origin: FoundrySoundOrigin,
    radius: number,
    options: Record<string, unknown>
  ): Promise<FoundrySoundLike | null>;
}

/**
 * `game.audio`, the client's `AudioHelper`. `preload(src)` emits
 * `preloadAudio` to the other clients synchronously, then loads the file
 * locally — after the audio unlock.
 */
export interface FoundryAudioHelperLike {
  locked?: boolean | undefined;
  preload?(src: string): Promise<FoundrySoundLike>;
}

export interface FoundryAudioGlobals {
  CONFIG?: { soundEffects?: Record<string, unknown> | undefined };
  canvas?:
    | {
        ready?: boolean | undefined;
        scene?: { id: string } | null | undefined;
        sounds?: FoundrySoundsLayer | undefined;
      }
    | null
    | undefined;
  game?: { audio?: FoundryAudioHelperLike | undefined } | undefined;
}

export type AudioGlobalsProvider = () => FoundryAudioGlobals;
