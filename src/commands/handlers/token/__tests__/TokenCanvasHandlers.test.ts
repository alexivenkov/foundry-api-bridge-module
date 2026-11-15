import { createGetSelectedTokensHandler } from '../GetSelectedTokensHandler';
import { createSelectTokensHandler } from '../SelectTokensHandler';
import { createSetTargetsHandler } from '../SetTargetsHandler';
import { createShowSpeechBubbleHandler } from '../ShowSpeechBubbleHandler';
import type { FoundryTokenDocument } from '../tokenTypes';

function setup(): {
  deps: Parameters<typeof createSelectTokensHandler>[0] & object;
  broadcast: jest.Mock;
  setTargets: jest.Mock;
} {
  const controlled = new Set<string>();
  const placeable = {
    id: 't1',
    document: { id: 't1', name: 'Goblin', actorId: 'a1' },
    control: jest.fn(() => {
      controlled.add('t1');
      return true;
    })
  };
  const targets = new Set<{ id: string }>();
  const setTargets = jest.fn((ids: string[]) => {
    targets.clear();
    for (const id of ids) {
      targets.add({ id });
    }
  });
  const document = {
    id: 't1',
    name: 'Goblin',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: { src: 'goblin.webp' },
    disposition: -1,
    actor: null,
    update: jest.fn(),
    delete: jest.fn()
  } as FoundryTokenDocument;
  const scene = {
    id: 'keep',
    tokens: { get: (id: string) => (id === 't1' ? document : undefined), contents: [document] },
    createEmbeddedDocuments: jest.fn()
  };
  const broadcast = jest.fn().mockResolvedValue({});
  const globals = {
    canvas: {
      scene: { id: 'keep' },
      tokens: {
        get: (id: string) => (id === 't1' ? placeable : undefined),
        get controlled() {
          return controlled.has('t1') ? [placeable] : [];
        },
        releaseAll: () => {
          controlled.clear();
          return 0;
        },
        setTargets
      },
      hud: { bubbles: { broadcast } }
    },
    game: { user: { targets }, scenes: { get: (id: string) => (id === 'keep' ? scene : undefined) } }
  };
  const game = { scenes: { get: (id: string) => (id === 'keep' ? scene : undefined), active: scene } };
  return { deps: { gameProvider: { getGame: () => game }, globals: () => globals }, broadcast, setTargets };
}

describe('token canvas handlers', () => {
  it('selects tokens and reads the selection back', async () => {
    const { deps } = setup();
    await expect(createSelectTokensHandler(deps)({ tokenIds: ['t1'] })).resolves.toEqual({ sceneId: 'keep', selected: ['t1'] });
    await expect(createGetSelectedTokensHandler(deps)({})).resolves.toEqual({
      sceneId: 'keep',
      tokens: [{ id: 't1', name: 'Goblin', actorId: 'a1' }]
    });
  });

  it('sets the whole target set', async () => {
    const { deps, setTargets } = setup();
    await expect(createSetTargetsHandler(deps)({ tokenIds: ['t1', 't1'] })).resolves.toEqual({ sceneId: 'keep', targets: ['t1'] });
    expect(setTargets).toHaveBeenCalledWith(['t1'], { mode: 'replace' });
  });

  it('rejects an invalid request and a token off the canvas', async () => {
    const { deps } = setup();
    await expect(createSetTargetsHandler(deps)({ tokenIds: [''] })).rejects.toThrow('tokenIds');
    await expect(createSelectTokensHandler(deps)({ tokenIds: ['far'] })).rejects.toThrow('Token not found on canvas: far');
  });

  it('shows a speech bubble to everyone, as plain text', async () => {
    const { deps, broadcast } = setup();

    await expect(createShowSpeechBubbleHandler(deps)({ tokenId: 't1', text: 'You <shall> not pass' })).resolves.toEqual({
      sceneId: 'keep',
      tokenId: 't1',
      shownHere: true
    });
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }), 'You &lt;shall&gt; not pass', { pan: true, requireVisible: false });
  });

  it('rejects an empty bubble and reports a missing token', async () => {
    const { deps } = setup();
    await expect(createShowSpeechBubbleHandler(deps)({ tokenId: 't1', text: '   ' })).rejects.toThrow('text');
    await expect(createShowSpeechBubbleHandler(deps)({ tokenId: 'ghost', text: 'Hi' })).rejects.toThrow('Token not found: ghost');
  });
});
