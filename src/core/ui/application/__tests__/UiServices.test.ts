import { CanvasUnavailableError } from '../../domain';
import { CanvasViewService } from '../CanvasViewService';
import { FakeViewport } from './fakePorts';

describe('CanvasViewService', () => {
  it('pans the view and resolves once the canvas has finished', async () => {
    const viewport = new FakeViewport();
    const pan = { x: 100, y: 200, scale: 1.5, duration: 500 };

    await new CanvasViewService({ viewport }).panCanvas({ pan });

    expect(viewport.pans).toEqual([pan]);
    expect(viewport.finished).toBe(1);
  });

  it('pings the location and resolves once the canvas has finished', async () => {
    const viewport = new FakeViewport();
    const ping = { x: 50, y: 75, style: 'arrow' };

    const pinged = await new CanvasViewService({ viewport }).pingLocation({ ping });

    expect(pinged).toBe(true);
    expect(viewport.pings).toEqual([ping]);
    expect(viewport.finished).toBe(1);
  });

  it('reports a ping the canvas refused', async () => {
    const viewport = new FakeViewport();
    viewport.refusesPings = true;

    await expect(new CanvasViewService({ viewport }).pingLocation({ ping: { x: -5000, y: -5000 } })).resolves.toBe(false);
    expect(viewport.pings).toEqual([{ x: -5000, y: -5000 }]);
  });

  it('lets a missing canvas through for either command', async () => {
    const viewport = new FakeViewport();
    viewport.fails = new CanvasUnavailableError();
    const service = new CanvasViewService({ viewport });

    await expect(service.panCanvas({ pan: {} })).rejects.toThrow('Canvas not available');
    await expect(service.pingLocation({ ping: { x: 0, y: 0 } })).rejects.toThrow(CanvasUnavailableError);
  });
});
