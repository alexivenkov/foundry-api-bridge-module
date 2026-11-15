import {
  FoundryCanvasTokenSelection,
  FoundrySpeechBubbles,
  type FoundryCanvasInteractionGlobals
} from '../FoundryCanvasInteraction';

function canvasToken(id: string, controlled: Set<string>): { id: string; document: { id: string; name: string; actorId: string | null }; control: jest.Mock } {
  return {
    id,
    document: { id, name: `Token ${id}`, actorId: 'a1' },
    control: jest.fn(() => {
      controlled.add(id);
      return true;
    })
  };
}

function globals(options: { setTargets?: boolean; active?: boolean } = {}): {
  globals: FoundryCanvasInteractionGlobals;
  controlled: Set<string>;
  layer: { releaseAll: jest.Mock; activate: jest.Mock; setTargets?: jest.Mock };
  user: { targets: Set<{ id: string }>; updateTokenTargets: jest.Mock };
} {
  const controlled = new Set<string>();
  const tokens = new Map([
    ['t1', canvasToken('t1', controlled)],
    ['t2', canvasToken('t2', controlled)]
  ]);
  const user = {
    targets: new Set<{ id: string }>(),
    updateTokenTargets: jest.fn((ids: string[]) => {
      user.targets = new Set(ids.map((id) => ({ id })));
    })
  };
  const layer = {
    get: (id: string) => tokens.get(id),
    get controlled() {
      return [...controlled].map((id) => tokens.get(id)).filter((token) => token !== undefined);
    },
    releaseAll: jest.fn(() => {
      const count = controlled.size;
      controlled.clear();
      return count;
    }),
    active: options.active ?? true,
    activate: jest.fn(),
    ...(options.setTargets !== false
      ? {
          setTargets: jest.fn((ids: string[]) => {
            user.targets = new Set(ids.map((id) => ({ id })));
          })
        }
      : {})
  };
  return { globals: { canvas: { scene: { id: 'keep' }, tokens: layer }, game: { user } }, controlled, layer, user };
}

describe('FoundryCanvasTokenSelection', () => {
  it('selects tokens, releasing the others first on request', () => {
    const { globals: g, layer } = globals();
    const selection = new FoundryCanvasTokenSelection(() => g);

    expect(selection.select(['t1'], true)).toEqual(['t1']);
    expect(selection.select(['t2'], false)).toEqual(['t1', 't2']);
    expect(selection.select(['t2'], true)).toEqual(['t2']);
    expect(layer.releaseAll).toHaveBeenCalledTimes(2);
    expect(selection.selected()).toEqual([{ id: 't2', name: 'Token t2', actorId: 'a1' }]);
  });

  it('activates the token layer before selecting, since Foundry 14 controls only on the active layer', () => {
    const { globals: g, layer } = globals({ active: false });
    new FoundryCanvasTokenSelection(() => g).select(['t1'], true);
    expect(layer.activate).toHaveBeenCalled();
  });

  it('replaces the targets through the token layer, or the user API of older cores', () => {
    const modern = globals();
    expect(new FoundryCanvasTokenSelection(() => modern.globals).setTargets(['t1', 't2'])).toEqual(['t1', 't2']);
    expect(modern.layer.setTargets).toHaveBeenCalledWith(['t1', 't2'], { mode: 'replace' });

    const older = globals({ setTargets: false });
    expect(new FoundryCanvasTokenSelection(() => older.globals).setTargets(['t2'])).toEqual(['t2']);
    expect(older.user.updateTokenTargets).toHaveBeenCalledWith(['t2']);
  });

  it('reports the viewed scene and whether tokens are on the canvas', () => {
    const { globals: g } = globals();
    const selection = new FoundryCanvasTokenSelection(() => g);
    expect(selection.isAvailable()).toBe(true);
    expect(selection.viewedSceneId()).toBe('keep');
    expect(selection.isOnCanvas('t1')).toBe(true);
    expect(selection.isOnCanvas('far')).toBe(false);
    expect(new FoundryCanvasTokenSelection(() => ({ canvas: null })).isAvailable()).toBe(false);
  });
});

describe('FoundrySpeechBubbles', () => {
  const document = { id: 't1' };
  const scenes = { get: (id: string) => (id === 'keep' ? { tokens: { get: (tokenId: string) => (tokenId === 't1' ? document : undefined) } } : undefined) };

  it('broadcasts the bubble for the token document', async () => {
    const broadcast = jest.fn().mockResolvedValue({});
    const bubbles = new FoundrySpeechBubbles(() => ({ canvas: { hud: { bubbles: { broadcast } } }, game: { scenes } }));

    expect(bubbles.support()).toBe('broadcast');
    await expect(bubbles.broadcast('keep', 't1', 'Hi', { pan: false, requireVisible: true })).resolves.toBe(true);
    expect(broadcast).toHaveBeenCalledWith(document, 'Hi', { pan: false, requireVisible: true });
  });

  it('reports a bubble this client did not show', async () => {
    const broadcast = jest.fn().mockResolvedValue(null);
    const bubbles = new FoundrySpeechBubbles(() => ({ canvas: { hud: { bubbles: { broadcast } } }, game: { scenes } }));
    await expect(bubbles.broadcast('keep', 't1', 'Hi', { pan: true, requireVisible: false })).resolves.toBe(false);
  });

  it('tells a local-only implementation and a missing canvas apart', () => {
    expect(new FoundrySpeechBubbles(() => ({ canvas: { hud: { bubbles: { say: jest.fn() } } } })).support()).toBe('local-only');
    expect(new FoundrySpeechBubbles(() => ({ canvas: null })).support()).toBe('unavailable');
  });
});
