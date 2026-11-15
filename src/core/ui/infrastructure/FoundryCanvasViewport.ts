import type { CanvasPan, CanvasPing, CanvasViewport } from '@/core/ui/domain';
import { readCanvas, type CanvasProvider } from './uiGlobals';

/** Only what is set is passed on, so the canvas keeps its own defaults for the rest. */
export class FoundryCanvasViewport implements CanvasViewport {
  constructor(private readonly canvas: CanvasProvider = readCanvas) {}

  async pan(pan: CanvasPan): Promise<void> {
    const view: Record<string, unknown> = {};
    if (pan.x !== undefined) {
      view['x'] = pan.x;
    }
    if (pan.y !== undefined) {
      view['y'] = pan.y;
    }
    if (pan.scale !== undefined) {
      view['scale'] = pan.scale;
    }
    if (pan.duration !== undefined) {
      view['duration'] = pan.duration;
    }

    await this.canvas().animatePan(view);
  }

  async ping(ping: CanvasPing): Promise<boolean> {
    const options: Record<string, unknown> = {};
    if (ping.style !== undefined) {
      options['style'] = ping.style;
    }
    if (ping.color !== undefined) {
      options['color'] = ping.color;
    }
    if (ping.duration !== undefined) {
      options['duration'] = ping.duration;
    }

    // `Canvas#ping` resolves to false when it refuses the point — outside the
    // canvas rectangle nothing is drawn or broadcast — or when the animation of
    // a drawn ping is cut short. Whatever else it resolves to, the ping went out.
    const drawn = await this.canvas().ping({ x: ping.x, y: ping.y }, options);
    return drawn !== false;
  }
}
