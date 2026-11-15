import { requireScene, type SceneLocator } from '@/core/shared';
import {
  CanvasTokensUnavailableError,
  SpeechBubblesUnavailableError,
  TokenNotFoundError,
  TokenNotOnCanvasError,
  toPlainBubbleHtml,
  type CanvasTokenSelection,
  type SelectedToken,
  type SpeechBubbles,
  type TokenStore
} from '@/core/tokens/domain';
import type { SelectTokensCommand, SetTargetsCommand, ShowSpeechBubbleCommand } from './commands';

export interface TokenCanvasServiceDependencies {
  readonly scenes: SceneLocator;
  readonly tokens: TokenStore;
  readonly selection: CanvasTokenSelection;
  readonly bubbles: SpeechBubbles;
}

export interface CanvasTokensResult {
  readonly sceneId: string;
  readonly tokenIds: readonly string[];
}

export interface SelectionResult {
  readonly sceneId: string | null;
  readonly tokens: readonly SelectedToken[];
}

export interface SpeechBubbleResult {
  readonly sceneId: string;
  readonly tokenId: string;
  readonly shownHere: boolean;
}

/**
 * What the GM does on the canvas: select tokens, set targets, let a token
 * speak. Selection and targets are client state of the GM user and only reach
 * tokens of the viewed scene.
 */
export class TokenCanvasService {
  constructor(private readonly deps: TokenCanvasServiceDependencies) {}

  selectTokens(command: SelectTokensCommand): CanvasTokensResult {
    const sceneId = this.requireCanvas(command.tokenIds);
    return { sceneId, tokenIds: this.deps.selection.select(command.tokenIds, command.releaseOthers) };
  }

  getSelection(): SelectionResult {
    if (!this.deps.selection.isAvailable()) {
      return { sceneId: null, tokens: [] };
    }
    return { sceneId: this.deps.selection.viewedSceneId(), tokens: this.deps.selection.selected() };
  }

  setTargets(command: SetTargetsCommand): CanvasTokensResult {
    const sceneId = this.requireCanvas(command.tokenIds);
    return { sceneId, tokenIds: this.deps.selection.setTargets(command.tokenIds) };
  }

  async showSpeechBubble(command: ShowSpeechBubbleCommand): Promise<SpeechBubbleResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (this.deps.tokens.findToken(scene.id, command.tokenId) === null) {
      throw new TokenNotFoundError(command.tokenId);
    }
    const support = this.deps.bubbles.support();
    if (support !== 'broadcast') {
      throw new SpeechBubblesUnavailableError(support);
    }
    const shownHere = await this.deps.bubbles.broadcast(
      scene.id,
      command.tokenId,
      toPlainBubbleHtml(command.text),
      command.options
    );
    return { sceneId: scene.id, tokenId: command.tokenId, shownHere };
  }

  /** Every token must be on the canvas before anything changes. */
  private requireCanvas(tokenIds: readonly string[]): string {
    const sceneId = this.deps.selection.isAvailable() ? this.deps.selection.viewedSceneId() : null;
    if (sceneId === null) {
      throw new CanvasTokensUnavailableError();
    }
    const missing = tokenIds.find((tokenId) => !this.deps.selection.isOnCanvas(tokenId));
    if (missing !== undefined) {
      throw new TokenNotOnCanvasError(missing);
    }
    return sceneId;
  }
}
