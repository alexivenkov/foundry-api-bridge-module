import { setTokenTargetHandler } from '../SetTokenTargetHandler';

interface MockPlaceable {
  id: string;
  setTarget: jest.Mock;
}

interface MockUser {
  id: string;
  targets: Set<MockPlaceable>;
}

interface MockGlobals {
  game: { user: MockUser };
  canvas: { tokens: { get: jest.Mock; placeables: MockPlaceable[] } | null } | null;
}

let placeable: MockPlaceable;
let user: MockUser;
let globals: MockGlobals;

beforeEach(() => {
  jest.clearAllMocks();
  placeable = { id: 'token-1', setTarget: jest.fn() };
  user = { id: 'user-1', targets: new Set() };
  globals = {
    game: { user },
    canvas: {
      tokens: {
        get: jest.fn().mockImplementation((id: string) => (id === placeable.id ? placeable : undefined)),
        placeables: [placeable]
      }
    }
  };
  (global as Record<string, unknown>)['game'] = globals.game;
  (global as Record<string, unknown>)['canvas'] = globals.canvas;
});

afterEach(() => {
  delete (global as Record<string, unknown>)['canvas'];
});

describe('setTokenTargetHandler', () => {
  it('targets a token with releaseOthers=true by default', async () => {
    const result = await setTokenTargetHandler({ tokenId: 'token-1', targeted: true });

    expect(placeable.setTarget).toHaveBeenCalledWith(true, {
      user,
      releaseOthers: true
    });
    expect(result).toEqual({ tokenId: 'token-1', targeted: true });
  });

  it('untargets a token when targeted=false', async () => {
    const result = await setTokenTargetHandler({ tokenId: 'token-1', targeted: false });

    expect(placeable.setTarget).toHaveBeenCalledWith(false, {
      user,
      releaseOthers: true
    });
    expect(result.targeted).toBe(false);
  });

  it('passes through explicit releaseOthers=false', async () => {
    await setTokenTargetHandler({
      tokenId: 'token-1',
      targeted: true,
      releaseOthers: false
    });

    expect(placeable.setTarget).toHaveBeenCalledWith(true, {
      user,
      releaseOthers: false
    });
  });

  it('throws when canvas is null', async () => {
    (global as Record<string, unknown>)['canvas'] = null;

    await expect(
      setTokenTargetHandler({ tokenId: 'token-1', targeted: true })
    ).rejects.toThrow('Canvas tokens layer not available');
  });

  it('throws when canvas.tokens is null', async () => {
    (global as Record<string, unknown>)['canvas'] = { tokens: null };

    await expect(
      setTokenTargetHandler({ tokenId: 'token-1', targeted: true })
    ).rejects.toThrow('Canvas tokens layer not available');
  });

  it('throws when token placeable is not found', async () => {
    globals.canvas!.tokens!.get.mockReturnValue(undefined);

    await expect(
      setTokenTargetHandler({ tokenId: 'nonexistent', targeted: true })
    ).rejects.toThrow('Token not found on canvas: nonexistent');
  });

  it('returns the same tokenId and targeted state echoed back', async () => {
    const result = await setTokenTargetHandler({ tokenId: 'token-1', targeted: true });
    expect(result).toEqual({ tokenId: 'token-1', targeted: true });
  });
});
