import { foundryGeneration } from '@/compat/foundryVersion';
import { CanvasNotReadyError, type CanvasStage, type CanvasViewState, type ScrollingText } from '@/core/ui/domain';
import type { FoundryStageCanvas } from './foundryUiTypes';
import { textAnchorCode } from './gridCodes';
import { readStageGlobals, type StageGlobalsProvider } from './uiGlobals';

const LEVELS_MIN_GENERATION = 14;

function scrollingTextOptions(text: ScrollingText): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  if (text.duration !== undefined) {
    options['duration'] = text.duration;
  }
  if (text.jitter !== undefined) {
    options['jitter'] = text.jitter;
  }
  if (text.anchor !== undefined) {
    options['anchor'] = textAnchorCode(text.anchor);
  }
  if (text.direction !== undefined) {
    options['direction'] = textAnchorCode(text.direction);
  }
  // The rest is PIXI text style; without `stroke` the core picks one that contrasts with the fill.
  if (text.color !== undefined) {
    options['fill'] = text.color;
  }
  if (text.fontSize !== undefined) {
    options['fontSize'] = text.fontSize;
  }
  return options;
}

/**
 * The canvas of the GM's client (`Canvas`, Foundry 13.351 and 14.368). The
 * stage pivot is the view center; scrolling text is drawn locally only.
 */
export class FoundryCanvasStage implements CanvasStage {
  constructor(
    private readonly globals: StageGlobalsProvider = readStageGlobals,
    private readonly generation: () => number = foundryGeneration
  ) {}

  isReady(): boolean {
    const canvas = this.globals().canvas;
    return Boolean(canvas?.ready) && Boolean(canvas?.scene);
  }

  view(): CanvasViewState {
    const canvas = this.requireCanvas();
    const scene = canvas.scene;
    if (scene === null) {
      throw new CanvasNotReadyError();
    }
    const scale = canvas.stage.scale.x;
    const center = { x: canvas.stage.pivot.x, y: canvas.stage.pivot.y };
    const width = (canvas.screenDimensions?.[0] ?? 0) / scale;
    const height = (canvas.screenDimensions?.[1] ?? 0) / scale;
    const view: CanvasViewState = {
      sceneId: scene.id,
      sceneName: scene.name ?? '',
      center,
      scale,
      visibleArea: { x: center.x - width / 2, y: center.y - height / 2, width, height }
    };
    return this.generation() >= LEVELS_MIN_GENERATION ? { ...view, levelId: canvas.level?.id ?? null } : view;
  }

  /**
   * The core draws nothing while the world setting `core.scrollingStatusText`
   * is off, so that is answered up front. The animation is not awaited: it
   * resolves only when the text has faded out.
   */
  showScrollingText(text: ScrollingText): boolean {
    const { canvas, game } = this.globals();
    if (game?.settings?.get('core', 'scrollingStatusText') === false) {
      return false;
    }
    const layer = canvas?.interface;
    if (!layer) {
      throw new CanvasNotReadyError();
    }
    layer
      .createScrollingText({ x: text.origin.x, y: text.origin.y }, text.text, scrollingTextOptions(text))
      .catch(() => undefined);
    return true;
  }

  private requireCanvas(): FoundryStageCanvas {
    const canvas = this.globals().canvas;
    if (!canvas?.ready) {
      throw new CanvasNotReadyError();
    }
    return canvas;
  }
}
