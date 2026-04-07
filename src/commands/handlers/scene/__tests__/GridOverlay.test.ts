import { addGridOverlay, removeGridOverlay, type OverlayCanvas } from '../GridOverlay';

interface MockChild {
  x: number;
  y: number;
  alpha: number;
  name: string;
  text?: string;
}

function createMockPixi() {
  const children: MockChild[] = [];

  const MockContainer = jest.fn().mockImplementation(() => ({
    name: '',
    x: 0,
    y: 0,
    alpha: 1,
    addChild: jest.fn((child: MockChild) => { children.push(child); }),
    destroy: jest.fn()
  }));

  const MockGraphics = jest.fn().mockImplementation(() => ({
    name: '',
    x: 0,
    y: 0,
    alpha: 1,
    lineStyle: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn()
  }));

  const MockText = jest.fn().mockImplementation((text: string) => ({
    name: '',
    text,
    x: 0,
    y: 0,
    alpha: 1
  }));

  const MockTextStyle = jest.fn().mockImplementation((opts: unknown) => opts);

  return {
    PIXI: {
      Container: MockContainer,
      Graphics: MockGraphics,
      Text: MockText,
      TextStyle: MockTextStyle
    },
    children,
    MockText
  };
}

function createMockCanvas(gridSize: number = 100): OverlayCanvas {
  return {
    scene: {
      grid: { size: gridSize },
      dimensions: {
        sceneWidth: 500,
        sceneHeight: 300,
        sceneX: 0,
        sceneY: 0
      }
    },
    stage: {
      name: 'stage',
      x: 0,
      y: 0,
      alpha: 1,
      addChild: jest.fn(),
      removeChild: jest.fn(),
      destroy: jest.fn()
    }
  };
}

function clearPixi(): void {
  delete (globalThis as Record<string, unknown>)['PIXI'];
}

describe('GridOverlay', () => {
  afterEach(clearPixi);

  describe('addGridOverlay', () => {
    it('should return undefined when PIXI is not available', () => {
      clearPixi();
      const canvas = createMockCanvas();

      const result = addGridOverlay(canvas);

      expect(result).toBeUndefined();
    });

    it('should create overlay and add to stage', () => {
      const { PIXI } = createMockPixi();
      (globalThis as Record<string, unknown>)['PIXI'] = PIXI;
      const canvas = createMockCanvas();

      const overlay = addGridOverlay(canvas);

      expect(overlay).toBeDefined();
      expect(canvas.stage.addChild).toHaveBeenCalledWith(overlay);
    });

    it('should create text labels for each grid cell', () => {
      const { PIXI, MockText } = createMockPixi();
      (globalThis as Record<string, unknown>)['PIXI'] = PIXI;
      // 500x300 scene with grid 100 = 5x3 = 15 cells
      const canvas = createMockCanvas(100);

      addGridOverlay(canvas);

      // 15 text labels created (5 columns x 3 rows)
      expect(MockText.mock.calls.length).toBe(15);
    });

    it('should format labels as x,y', () => {
      const { PIXI, MockText } = createMockPixi();
      (globalThis as Record<string, unknown>)['PIXI'] = PIXI;
      const canvas = createMockCanvas(100);

      addGridOverlay(canvas);

      const firstLabel = MockText.mock.calls[0]?.[0] as string;
      expect(firstLabel).toBe('0,0');
    });

    it('should set text alpha to ~0.65', () => {
      const { PIXI, children } = createMockPixi();
      (globalThis as Record<string, unknown>)['PIXI'] = PIXI;
      const canvas = createMockCanvas(100);

      addGridOverlay(canvas);

      const textChildren = children.filter(c => 'text' in c);
      expect(textChildren.length).toBeGreaterThan(0);
      expect(textChildren[0]?.alpha).toBe(0.65);
    });

    it('should create graphics for grid lines', () => {
      const { PIXI } = createMockPixi();
      (globalThis as Record<string, unknown>)['PIXI'] = PIXI;
      const canvas = createMockCanvas();

      addGridOverlay(canvas);

      expect(PIXI.Graphics).toHaveBeenCalledTimes(1);
    });

    it('should handle scene with offset dimensions', () => {
      const { PIXI, MockText } = createMockPixi();
      (globalThis as Record<string, unknown>)['PIXI'] = PIXI;
      const canvas = createMockCanvas(100);
      canvas.scene.dimensions.sceneX = 200;
      canvas.scene.dimensions.sceneY = 100;
      canvas.scene.dimensions.sceneWidth = 300;
      canvas.scene.dimensions.sceneHeight = 200;

      addGridOverlay(canvas);

      // Start grid: floor(200/100)=2, floor(100/100)=1
      // End grid: ceil((200+300)/100)=5, ceil((100+200)/100)=3
      // Cells: (5-2)*(3-1) = 3*2 = 6
      expect(MockText.mock.calls.length).toBe(6);
      const firstLabel = MockText.mock.calls[0]?.[0] as string;
      expect(firstLabel).toBe('2,1');
    });
  });

  describe('removeGridOverlay', () => {
    it('should remove overlay from stage and destroy it', () => {
      const { PIXI } = createMockPixi();
      (globalThis as Record<string, unknown>)['PIXI'] = PIXI;
      const canvas = createMockCanvas();
      const overlay = addGridOverlay(canvas);
      if (!overlay) throw new Error('Expected overlay');

      removeGridOverlay(canvas, overlay);

      expect(canvas.stage.removeChild).toHaveBeenCalledWith(overlay);
      expect(overlay.destroy).toHaveBeenCalledWith({ children: true });
    });
  });
});
