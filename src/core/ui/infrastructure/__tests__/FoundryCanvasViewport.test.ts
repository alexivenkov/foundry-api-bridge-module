import { CanvasUnavailableError } from '../../domain';
import { FoundryCanvasViewport } from '../FoundryCanvasViewport';
import type { FoundryViewCanvas } from '../foundryUiTypes';
import { readCanvas } from '../uiGlobals';

interface CanvasMocks {
  canvas: FoundryViewCanvas;
  animatePan: jest.Mock;
  ping: jest.Mock;
}

// `Canvas#ping` resolves to what `Ping#animate` does: true once the animation has run to its end.
function viewCanvas(): CanvasMocks {
  const animatePan = jest.fn().mockResolvedValue(true);
  const ping = jest.fn().mockResolvedValue(true);
  return { canvas: { animatePan, ping }, animatePan, ping };
}

function viewportOver(canvas: FoundryViewCanvas): FoundryCanvasViewport {
  return new FoundryCanvasViewport(() => canvas);
}

describe('FoundryCanvasViewport', () => {
  describe('pan', () => {
    it('animates the pan with everything that is set', async () => {
      const { canvas, animatePan } = viewCanvas();

      await viewportOver(canvas).pan({ x: 100, y: 200, scale: 1.5, duration: 500 });

      expect(animatePan).toHaveBeenCalledTimes(1);
      expect(animatePan).toHaveBeenCalledWith({ x: 100, y: 200, scale: 1.5, duration: 500 });
    });

    it('passes only what is set, so the canvas keeps the rest of the view', async () => {
      const { canvas, animatePan } = viewCanvas();

      await viewportOver(canvas).pan({ x: 50, y: undefined, scale: undefined });

      expect(Object.keys((animatePan.mock.calls as unknown[][])[0]?.[0] as object)).toEqual(['x']);
    });

    it('passes zero on: it is a coordinate, a scale and a duration like any other', async () => {
      const { canvas, animatePan } = viewCanvas();

      await viewportOver(canvas).pan({ x: 0, y: 0, duration: 0 });

      expect(animatePan).toHaveBeenCalledWith({ x: 0, y: 0, duration: 0 });
    });

    it('pans with an empty view when nothing is set', async () => {
      const { canvas, animatePan } = viewCanvas();

      await viewportOver(canvas).pan({});

      expect(animatePan).toHaveBeenCalledWith({});
    });

    it('resolves only when the animation has ended', async () => {
      const { canvas, animatePan } = viewCanvas();
      let ended = false;
      animatePan.mockImplementation(async () => {
        await Promise.resolve();
        ended = true;
      });

      await viewportOver(canvas).pan({ x: 1 });

      expect(ended).toBe(true);
    });
  });

  describe('ping', () => {
    it('pings the point with no options when none is set', async () => {
      const { canvas, ping } = viewCanvas();

      await viewportOver(canvas).ping({ x: 100, y: 200 });

      expect(ping).toHaveBeenCalledTimes(1);
      expect(ping).toHaveBeenCalledWith({ x: 100, y: 200 }, {});
    });

    it('passes the style, the color and the duration that are set', async () => {
      const { canvas, ping } = viewCanvas();

      await viewportOver(canvas).ping({ x: 50, y: 75, style: 'chevron', color: '#ff0000', duration: 1500 });

      expect(ping).toHaveBeenCalledWith({ x: 50, y: 75 }, { style: 'chevron', color: '#ff0000', duration: 1500 });
    });

    it('passes a style of another module on untouched', async () => {
      const { canvas, ping } = viewCanvas();

      await viewportOver(canvas).ping({ x: 0, y: 0, style: 'my-module.sparkle' });

      expect(ping).toHaveBeenCalledWith({ x: 0, y: 0 }, { style: 'my-module.sparkle' });
    });

    it('keeps the options free of keys that are not set, undefined included', async () => {
      const { canvas, ping } = viewCanvas();

      await viewportOver(canvas).ping({ x: 1, y: 2, style: undefined, color: '#00ff00', duration: undefined });

      expect(Object.keys((ping.mock.calls as unknown[][])[0]?.[1] as object)).toEqual(['color']);
    });

    it('reports a ping the core has drawn', async () => {
      const { canvas } = viewCanvas();

      await expect(viewportOver(canvas).ping({ x: 100, y: 200 })).resolves.toBe(true);
    });

    it('reports a ping the core refused, as it does for a point outside the canvas', async () => {
      const { canvas, ping } = viewCanvas();
      ping.mockResolvedValue(false);

      await expect(viewportOver(canvas).ping({ x: -5000, y: -5000 })).resolves.toBe(false);
      expect(ping).toHaveBeenCalledWith({ x: -5000, y: -5000 }, {});
    });

    it('takes a ping the core resolved without a verdict as sent: only false is a refusal', async () => {
      const { canvas, ping } = viewCanvas();
      ping.mockResolvedValue(undefined);

      await expect(viewportOver(canvas).ping({ x: 1, y: 2 })).resolves.toBe(true);
    });

    it('lets a failure of the canvas through', async () => {
      const { canvas, ping } = viewCanvas();
      ping.mockRejectedValue(new Error('no scene'));

      await expect(viewportOver(canvas).ping({ x: 0, y: 0 })).rejects.toThrow('no scene');
    });
  });

  describe('by default', () => {
    afterEach(() => {
      delete (globalThis as Record<string, unknown>)['canvas'];
    });

    it('uses the canvas global, read when the command arrives', async () => {
      const viewport = new FoundryCanvasViewport();
      const { canvas, animatePan } = viewCanvas();
      (globalThis as Record<string, unknown>)['canvas'] = canvas;

      await viewport.pan({ x: 5 });

      expect(animatePan).toHaveBeenCalledWith({ x: 5 });
      expect(readCanvas()).toBe(canvas);
    });

    it.each([
      ['there is no canvas', false],
      ['the canvas is null', true]
    ])('is not available while %s', async (_case, setNull) => {
      if (setNull) {
        (globalThis as Record<string, unknown>)['canvas'] = null;
      }
      const viewport = new FoundryCanvasViewport();

      await expect(viewport.pan({})).rejects.toThrow(CanvasUnavailableError);
      await expect(viewport.ping({ x: 0, y: 0 })).rejects.toThrow('Canvas not available');
    });
  });
});
