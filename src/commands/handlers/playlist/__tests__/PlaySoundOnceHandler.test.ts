import { playSoundOnceHandler } from '../PlaySoundOnceHandler';

const mockPlay = jest.fn();
const mockLegacyPlay = jest.fn();

function setFoundryAudioHelper(): void {
  (globalThis as Record<string, unknown>)['foundry'] = {
    audio: {
      AudioHelper: { play: mockPlay }
    }
  };
}

function setLegacyAudioHelper(): void {
  (globalThis as Record<string, unknown>)['AudioHelper'] = { play: mockLegacyPlay };
}

function clearAll(): void {
  delete (globalThis as Record<string, unknown>)['foundry'];
  delete (globalThis as Record<string, unknown>)['AudioHelper'];
}

describe('playSoundOnceHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAll();
  });

  afterEach(clearAll);

  it('should play via foundry.audio.AudioHelper when present', async () => {
    setFoundryAudioHelper();
    mockPlay.mockResolvedValue(undefined);

    const result = await playSoundOnceHandler({ src: 'sounds/door.ogg' });

    expect(mockPlay).toHaveBeenCalledWith(
      { src: 'sounds/door.ogg', volume: 0.8, autoplay: true, loop: false },
      true
    );
    expect(result).toEqual({ playing: true, src: 'sounds/door.ogg', broadcast: true });
  });

  it('should fall back to legacy AudioHelper when foundry.audio absent', async () => {
    setLegacyAudioHelper();
    mockLegacyPlay.mockResolvedValue(undefined);

    const result = await playSoundOnceHandler({ src: 'sounds/sword.ogg' });

    expect(mockLegacyPlay).toHaveBeenCalledWith(
      { src: 'sounds/sword.ogg', volume: 0.8, autoplay: true, loop: false },
      true
    );
    expect(mockPlay).not.toHaveBeenCalled();
    expect(result.src).toBe('sounds/sword.ogg');
  });

  it('should apply default volume=0.8, loop=false, broadcast=true', async () => {
    setFoundryAudioHelper();
    mockPlay.mockResolvedValue(undefined);

    await playSoundOnceHandler({ src: 'sounds/x.ogg' });

    const call = mockPlay.mock.calls[0];
    expect(call?.[0]).toEqual({
      src: 'sounds/x.ogg',
      volume: 0.8,
      autoplay: true,
      loop: false
    });
    expect(call?.[1]).toBe(true);
  });

  it('should respect explicit overrides for volume, loop, broadcast', async () => {
    setFoundryAudioHelper();
    mockPlay.mockResolvedValue(undefined);

    const result = await playSoundOnceHandler({
      src: 'sounds/loop.ogg',
      volume: 0.3,
      loop: true,
      broadcast: false
    });

    expect(mockPlay).toHaveBeenCalledWith(
      { src: 'sounds/loop.ogg', volume: 0.3, autoplay: true, loop: true },
      false
    );
    expect(result.broadcast).toBe(false);
  });

  it('should throw when no AudioHelper API available', async () => {
    await expect(playSoundOnceHandler({ src: 'sounds/x.ogg' })).rejects.toThrow(
      'AudioHelper API not available'
    );
  });

  it('should pass broadcast=false explicitly to play call', async () => {
    setFoundryAudioHelper();
    mockPlay.mockResolvedValue(undefined);

    await playSoundOnceHandler({ src: 'sounds/private.ogg', broadcast: false });

    expect(mockPlay).toHaveBeenCalledWith(expect.objectContaining({ src: 'sounds/private.ogg' }), false);
  });

  it('should prefer foundry.audio.AudioHelper over legacy when both present', async () => {
    setFoundryAudioHelper();
    setLegacyAudioHelper();
    mockPlay.mockResolvedValue(undefined);

    await playSoundOnceHandler({ src: 'sounds/x.ogg' });

    expect(mockPlay).toHaveBeenCalled();
    expect(mockLegacyPlay).not.toHaveBeenCalled();
  });
});
