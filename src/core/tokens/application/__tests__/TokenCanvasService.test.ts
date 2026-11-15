import { NoActiveSceneError } from '../../../shared';
import {
  CanvasTokensUnavailableError,
  SpeechBubblesUnavailableError,
  TokenNotFoundError,
  TokenNotOnCanvasError,
  type CanvasTokenSelection,
  type SelectedToken,
  type SpeechBubbleOptions,
  type SpeechBubbleSupport,
  type SpeechBubbles
} from '../../domain';
import { TokenCanvasService } from '../TokenCanvasService';
import { FakeSceneLocator, FakeTokenStore, token } from './fakePorts';

class FakeSelection implements CanvasTokenSelection {
  available = true;
  viewed: string | null = 'keep';
  onCanvas = ['t1', 't2'];
  selection: string[] = [];
  targets: string[] = [];

  isAvailable(): boolean {
    return this.available;
  }
  viewedSceneId(): string | null {
    return this.viewed;
  }
  isOnCanvas(tokenId: string): boolean {
    return this.onCanvas.includes(tokenId);
  }
  select(tokenIds: readonly string[], releaseOthers: boolean): readonly string[] {
    this.selection = releaseOthers ? [...tokenIds] : [...new Set([...this.selection, ...tokenIds])];
    return this.selection;
  }
  selected(): readonly SelectedToken[] {
    return this.selection.map((id) => ({ id, name: id, actorId: null }));
  }
  setTargets(tokenIds: readonly string[]): readonly string[] {
    this.targets = [...tokenIds];
    return this.targets;
  }
}

class FakeBubbles implements SpeechBubbles {
  supported: SpeechBubbleSupport = 'broadcast';
  readonly sent: Array<{ tokenId: string; html: string; options: SpeechBubbleOptions }> = [];

  support(): SpeechBubbleSupport {
    return this.supported;
  }
  broadcast(_sceneId: string, tokenId: string, html: string, options: SpeechBubbleOptions): Promise<boolean> {
    this.sent.push({ tokenId, html, options });
    return Promise.resolve(true);
  }
}

function setup(active: string | null = 'keep'): { service: TokenCanvasService; selection: FakeSelection; bubbles: FakeBubbles } {
  const selection = new FakeSelection();
  const bubbles = new FakeBubbles();
  const service = new TokenCanvasService({
    scenes: new FakeSceneLocator(['keep'], active),
    tokens: new FakeTokenStore({ keep: [token({ id: 't1' })] }),
    selection,
    bubbles
  });
  return { service, selection, bubbles };
}

describe('TokenCanvasService', () => {
  it('selects tokens of the viewed scene, adding to the selection on request', () => {
    const { service } = setup();
    expect(service.selectTokens({ tokenIds: ['t1'], releaseOthers: true })).toEqual({ sceneId: 'keep', tokenIds: ['t1'] });
    expect(service.selectTokens({ tokenIds: ['t2'], releaseOthers: false }).tokenIds).toEqual(['t1', 't2']);
    expect(service.getSelection()).toEqual({
      sceneId: 'keep',
      tokens: [
        { id: 't1', name: 't1', actorId: null },
        { id: 't2', name: 't2', actorId: null }
      ]
    });
  });

  it('changes nothing when one token is not on the canvas', () => {
    const { service, selection } = setup();
    expect(() => service.selectTokens({ tokenIds: ['t1', 'far'], releaseOthers: true })).toThrow(new TokenNotOnCanvasError('far'));
    expect(() => service.setTargets({ tokenIds: ['far'] })).toThrow(TokenNotOnCanvasError);
    expect(selection.selection).toEqual([]);
    expect(selection.targets).toEqual([]);
  });

  it('needs a canvas that shows a scene for selection and targets', () => {
    const { service, selection } = setup();
    selection.viewed = null;
    expect(() => service.setTargets({ tokenIds: [] })).toThrow(CanvasTokensUnavailableError);
    selection.available = false;
    expect(() => service.selectTokens({ tokenIds: [], releaseOthers: true })).toThrow(CanvasTokensUnavailableError);
    expect(service.getSelection()).toEqual({ sceneId: null, tokens: [] });
  });

  it('replaces the whole target set', () => {
    const { service } = setup();
    expect(service.setTargets({ tokenIds: ['t2', 't1'] })).toEqual({ sceneId: 'keep', tokenIds: ['t2', 't1'] });
    expect(service.setTargets({ tokenIds: [] }).tokenIds).toEqual([]);
  });

  it('broadcasts a speech bubble with the text escaped', async () => {
    const { service, bubbles } = setup();

    await expect(
      service.showSpeechBubble({ sceneId: undefined, tokenId: 't1', text: 'Stop <right> there!', options: { pan: true, requireVisible: false } })
    ).resolves.toEqual({ sceneId: 'keep', tokenId: 't1', shownHere: true });
    expect(bubbles.sent).toEqual([{ tokenId: 't1', html: 'Stop &lt;right&gt; there!', options: { pan: true, requireVisible: false } }]);
  });

  it('refuses a bubble that only this client could show, or without a canvas', async () => {
    const { service, bubbles } = setup();
    const command = { sceneId: undefined, tokenId: 't1', text: 'Hi', options: { pan: false, requireVisible: false } };

    bubbles.supported = 'local-only';
    await expect(service.showSpeechBubble(command)).rejects.toThrow(
      'This Foundry version can only show a speech bubble locally, not to other users'
    );
    bubbles.supported = 'unavailable';
    await expect(service.showSpeechBubble(command)).rejects.toThrow(new SpeechBubblesUnavailableError('unavailable'));
    expect(bubbles.sent).toEqual([]);
  });

  it('resolves the scene and the token of a bubble first', async () => {
    const command = { sceneId: undefined, tokenId: 'ghost', text: 'Hi', options: { pan: false, requireVisible: false } };
    await expect(setup().service.showSpeechBubble(command)).rejects.toThrow(TokenNotFoundError);
    await expect(setup(null).service.showSpeechBubble(command)).rejects.toThrow(NoActiveSceneError);
  });
});
