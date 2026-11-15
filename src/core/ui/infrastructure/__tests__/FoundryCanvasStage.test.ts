import { FoundryCanvasStage } from '../FoundryCanvasStage';
import type { FoundryStageCanvas, FoundryStageGlobals } from '../foundryUiTypes';

interface World {
  globals: FoundryStageGlobals;
  canvas: FoundryStageCanvas;
  createScrollingText: jest.Mock;
  setting: { value: unknown };
}

function world(): World {
  const createScrollingText = jest.fn().mockResolvedValue(undefined);
  const canvas: FoundryStageCanvas = {
    ready: true,
    scene: { id: 's1', name: 'Crypt' },
    level: { id: 'lvl1' },
    stage: { pivot: { x: 1000, y: 800 }, scale: { x: 0.5 } },
    screenDimensions: [1600, 900],
    interface: { createScrollingText }
  };
  const setting = { value: true as unknown };
  const globals: FoundryStageGlobals = { canvas, game: { settings: { get: () => setting.value } } };
  return { globals, canvas, createScrollingText, setting };
}

describe('FoundryCanvasStage', () => {
  it('is ready only with a drawn scene', () => {
    const { globals, canvas } = world();
    const stage = new FoundryCanvasStage(() => globals, () => 13);

    expect(stage.isReady()).toBe(true);
    canvas.scene = null;
    expect(stage.isReady()).toBe(false);
    expect(new FoundryCanvasStage(() => ({}), () => 13).isReady()).toBe(false);
  });

  it('reads the pivot as the view center and derives the visible area', () => {
    const { globals } = world();

    expect(new FoundryCanvasStage(() => globals, () => 13).view()).toEqual({
      sceneId: 's1',
      sceneName: 'Crypt',
      center: { x: 1000, y: 800 },
      scale: 0.5,
      visibleArea: { x: -600, y: -100, width: 3200, height: 1800 }
    });
  });

  it('adds the viewed level on 14+ only', () => {
    const { globals, canvas } = world();

    expect(new FoundryCanvasStage(() => globals, () => 14).view().levelId).toBe('lvl1');
    canvas.level = null;
    expect(new FoundryCanvasStage(() => globals, () => 14).view().levelId).toBeNull();
  });

  it('starts scrolling text with the core codes and does not wait for the animation', () => {
    const { globals, createScrollingText } = world();
    createScrollingText.mockReturnValue(new Promise(() => undefined));

    const shown = new FoundryCanvasStage(() => globals, () => 13).showScrollingText({
      origin: { x: 10, y: 20 },
      text: 'Crit!',
      color: '#ff0000',
      fontSize: 32,
      anchor: 'bottom',
      direction: 'right',
      duration: 1500,
      jitter: 0.25
    });

    expect(shown).toBe(true);
    expect(createScrollingText).toHaveBeenCalledWith({ x: 10, y: 20 }, 'Crit!', {
      duration: 1500,
      jitter: 0.25,
      anchor: 1,
      direction: 4,
      fill: '#ff0000',
      fontSize: 32
    });
  });

  it('passes no options it was not given', () => {
    const { globals, createScrollingText } = world();

    new FoundryCanvasStage(() => globals, () => 13).showScrollingText({ origin: { x: 0, y: 0 }, text: 'x', anchor: 'center' });

    expect(createScrollingText).toHaveBeenCalledWith({ x: 0, y: 0 }, 'x', { anchor: 0 });
  });

  it('answers false when the world turned scrolling text off, drawing nothing', () => {
    const { globals, createScrollingText, setting } = world();
    setting.value = false;

    expect(new FoundryCanvasStage(() => globals, () => 13).showScrollingText({ origin: { x: 0, y: 0 }, text: 'x' })).toBe(false);
    expect(createScrollingText).not.toHaveBeenCalled();
  });

  it('swallows a failing animation instead of leaving it unhandled', async () => {
    const { globals, createScrollingText } = world();
    createScrollingText.mockRejectedValue(new Error('destroyed'));

    expect(new FoundryCanvasStage(() => globals, () => 13).showScrollingText({ origin: { x: 0, y: 0 }, text: 'x' })).toBe(true);
    await Promise.resolve();
  });

  it('refuses to read a canvas that is not ready', () => {
    const { globals, canvas } = world();
    canvas.ready = false;

    expect(() => new FoundryCanvasStage(() => globals, () => 13).view()).toThrow('Canvas is not ready');
  });
});
