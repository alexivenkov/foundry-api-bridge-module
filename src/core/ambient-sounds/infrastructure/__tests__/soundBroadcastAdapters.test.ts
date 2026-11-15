import { FoundryAudioPreloader } from '../FoundryAudioPreloader';
import { FoundryPositionalSoundEmitter } from '../FoundryPositionalSoundEmitter';
import type { FoundryAudioGlobals, FoundrySoundLike } from '../foundryAudioTypes';
import type { PositionalSound } from '../../domain';

// `emitAtPosition` and `AudioHelper#preload` are client-only (Foundry 13.351 /
// 14.368 sources): both emit to the other clients synchronously and then wait
// for the local audio unlock before loading, so the fakes return a promise
// that never settles to stand for a locked browser.

const NEVER = new Promise<never>(() => undefined);

function sound(overrides: Partial<PositionalSound> = {}): PositionalSound {
  return {
    src: 'sounds/trap.ogg',
    x: 100,
    y: 200,
    elevation: undefined,
    radius: 30,
    volume: 1,
    easing: true,
    walls: true,
    gmAlways: true,
    baseEffect: undefined,
    muffledEffect: undefined,
    ...overrides
  };
}

function emitterWith(
  emitAtPosition: jest.Mock,
  options: { locked?: boolean; ready?: boolean; sceneId?: string } = {}
): FoundryPositionalSoundEmitter {
  const globals: FoundryAudioGlobals = {
    canvas: {
      ready: options.ready ?? true,
      scene: { id: options.sceneId ?? 'scene-1' },
      sounds: { emitAtPosition }
    },
    game: { audio: { locked: options.locked ?? false } }
  };
  return new FoundryPositionalSoundEmitter(() => globals);
}

describe('FoundryPositionalSoundEmitter', () => {
  it('passes JSON-plain arguments, leaving elevation and effect intensity to the core when unset', async () => {
    const emit = jest.fn().mockResolvedValue({ failed: false });
    await emitterWith(emit).emit(sound({ baseEffect: { type: 'reverb', intensity: undefined } }));
    expect(emit).toHaveBeenCalledWith('sounds/trap.ogg', { x: 100, y: 200 }, 30, {
      volume: 1,
      easing: true,
      walls: true,
      gmAlways: true,
      baseEffect: { type: 'reverb' }
    });
  });

  it('passes an explicit elevation and both effects', async () => {
    const emit = jest.fn().mockResolvedValue({});
    await emitterWith(emit).emit(
      sound({
        elevation: 10,
        volume: 0.4,
        gmAlways: false,
        walls: false,
        baseEffect: { type: 'lowpass', intensity: 2 },
        muffledEffect: { type: 'reverb', intensity: 8 }
      })
    );
    expect(emit).toHaveBeenCalledWith('sounds/trap.ogg', { x: 100, y: 200, elevation: 10 }, 30, {
      volume: 0.4,
      easing: true,
      walls: false,
      gmAlways: false,
      baseEffect: { type: 'lowpass', intensity: 2 },
      muffledEffect: { type: 'reverb', intensity: 8 }
    });
  });

  it.each<[string, () => Promise<FoundrySoundLike | null>, string]>([
    ['the played sound', () => Promise.resolve({ failed: false }), 'done'],
    ['null (out of earshot)', () => Promise.resolve(null), 'inaudible'],
    ['a sound that failed to load', () => Promise.resolve({ failed: true }), 'failed'],
    ['a rejection', () => Promise.reject(new Error('canvas gone')), 'failed']
  ])('maps %s to %s', async (_label, outcome, expected) => {
    const emit = jest.fn().mockImplementation(outcome);
    await expect(emitterWith(emit).emit(sound())).resolves.toBe(expected);
  });

  it('does not wait for the local playback while the audio is locked', async () => {
    const emit = jest.fn().mockReturnValue(NEVER);
    await expect(emitterWith(emit, { locked: true }).emit(sound())).resolves.toBe('deferred');
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('swallows a later rejection of a deferred playback', async () => {
    const emit = jest.fn().mockReturnValue(Promise.reject(new Error('late')));
    await expect(emitterWith(emit, { locked: true }).emit(sound())).resolves.toBe('deferred');
  });

  it('reports the canvas scene only once the canvas is ready', () => {
    const emit = jest.fn();
    expect(emitterWith(emit, { sceneId: 'cave' }).canvasSceneId()).toBe('cave');
    expect(emitterWith(emit, { ready: false }).canvasSceneId()).toBeNull();
  });

  it('is unavailable without a canvas sound layer', async () => {
    expect(emitterWith(jest.fn()).isAvailable()).toBe(true);
    const noCanvas = new FoundryPositionalSoundEmitter(() => ({ canvas: { ready: false } }));
    expect(noCanvas.isAvailable()).toBe(false);
    expect(new FoundryPositionalSoundEmitter(() => ({})).canvasSceneId()).toBeNull();
    await expect(noCanvas.emit(sound())).resolves.toBe('failed');
  });
});

describe('FoundryAudioPreloader', () => {
  function preloaderWith(preload: jest.Mock | undefined, locked = false): FoundryAudioPreloader {
    const audio = preload !== undefined ? { locked, preload } : { locked };
    return new FoundryAudioPreloader(() => ({ game: { audio } }));
  }

  it('calls game.audio.preload with the path and reports the local load', async () => {
    const preload = jest.fn().mockResolvedValue({ failed: false });
    await expect(preloaderWith(preload).preload('sounds/a.ogg')).resolves.toBe('done');
    expect(preload).toHaveBeenCalledWith('sounds/a.ogg');
  });

  it('reports a failed load or a rejection as failed', async () => {
    await expect(preloaderWith(jest.fn().mockResolvedValue({ failed: true })).preload('a.ogg')).resolves.toBe('failed');
    await expect(preloaderWith(jest.fn().mockRejectedValue(new Error('x'))).preload('a.ogg')).resolves.toBe('failed');
  });

  it('does not wait for the local load while the audio is locked', async () => {
    const preload = jest.fn().mockReturnValue(NEVER);
    await expect(preloaderWith(preload, true).preload('a.ogg')).resolves.toBe('deferred');
    expect(preload).toHaveBeenCalledTimes(1);
  });

  it('is unavailable without AudioHelper#preload', async () => {
    expect(preloaderWith(jest.fn()).isAvailable()).toBe(true);
    expect(preloaderWith(undefined).isAvailable()).toBe(false);
    expect(new FoundryAudioPreloader(() => ({})).isAvailable()).toBe(false);
    await expect(preloaderWith(undefined).preload('a.ogg')).resolves.toBe('failed');
  });
});
