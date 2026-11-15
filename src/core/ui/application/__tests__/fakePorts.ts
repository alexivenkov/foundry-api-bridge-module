import type { CanvasPan, CanvasPing, CanvasViewport } from '../../domain';

export class FakeViewport implements CanvasViewport {
  readonly pans: CanvasPan[] = [];
  readonly pings: CanvasPing[] = [];
  finished = 0;
  fails: Error | undefined;
  refusesPings = false;

  pan(pan: CanvasPan): Promise<void> {
    this.pans.push(pan);
    return this.settle();
  }

  async ping(ping: CanvasPing): Promise<boolean> {
    this.pings.push(ping);
    await this.settle();
    return !this.refusesPings;
  }

  private async settle(): Promise<void> {
    await Promise.resolve();
    if (this.fails !== undefined) {
      throw this.fails;
    }
    this.finished += 1;
  }
}
