import { addGridOverlay, removeGridOverlay, type OverlayCanvas, type PixiConstructors } from '../gridOverlay';
import {
  FoundryMovementCollisions,
  FoundrySceneViewport,
  type FoundryCanvas,
  type FoundryCanvasScene,
  type FoundrySceneCanvasGlobals
} from '../sceneCanvas';

type Journal = string[];

/** PIXI classes that write what happens to them into a journal. */
function fakePixi(journal: Journal): PixiConstructors {
  class Container {
    name = '';
    x = 0;
    y = 0;
    alpha = 1;
    addChild(): void {
      journal.push('overlay.addChild');
    }
    destroy(options?: { children?: boolean }): void {
      journal.push(`overlay.destroy(${JSON.stringify(options)})`);
    }
  }
  class Graphics {
    name = '';
    x = 0;
    y = 0;
    alpha = 1;
    lineStyle(width: number, color: number, alpha: number): void {
      journal.push(`lineStyle(${String(width)}, ${String(color)}, ${String(alpha)})`);
    }
    moveTo(x: number, y: number): void {
      journal.push(`moveTo(${String(x)}, ${String(y)})`);
    }
    lineTo(x: number, y: number): void {
      journal.push(`lineTo(${String(x)}, ${String(y)})`);
    }
  }
  class Text {
    name = '';
    x = 0;
    y = 0;
    alpha = 1;
    constructor(public text: string) {
      journal.push(`label ${text}`);
    }
  }
  class TextStyle {
    fontFamily = '';
    fontSize = 0;
    fill = 0;
    stroke = 0;
    strokeThickness = 0;
    letterSpacing = 0;
    constructor(options: object) {
      Object.assign(this, options);
      journal.push(`style ${JSON.stringify(options)}`);
    }
  }
  return { Container, Graphics, Text, TextStyle };
}

function canvasScene(overrides: Partial<FoundryCanvasScene> = {}): FoundryCanvasScene {
  return {
    id: 'dungeon',
    name: 'Dungeon',
    grid: { size: 100 },
    dimensions: { sceneWidth: 200, sceneHeight: 100, sceneX: 0, sceneY: 0 },
    ...overrides
  };
}

function fakeCanvas(journal: Journal, overrides: Partial<FoundryCanvas> = {}): FoundryCanvas {
  const canvas: FoundryCanvas = {
    ready: true,
    app: {
      renderer: {
        render: (stage) => {
          journal.push(stage === canvas.stage ? 'render stage' : 'render something else');
        }
      },
      view: {
        toDataURL: (type, quality) => {
          journal.push(`toDataURL(${String(type)}, ${String(quality)})`);
          return 'data:image/webp;base64,QUJD';
        },
        width: 1920,
        height: 1080
      }
    },
    stage: {
      name: 'stage',
      x: 0,
      y: 0,
      alpha: 1,
      addChild: (child) => {
        journal.push(`stage.addChild ${child.name}`);
      },
      removeChild: (child) => {
        journal.push(`stage.removeChild ${child.name}`);
      },
      destroy: () => {
        journal.push('stage.destroy');
      }
    },
    scene: canvasScene(),
    ...overrides
  };
  return canvas;
}

function viewportOver(globals: FoundrySceneCanvasGlobals): FoundrySceneViewport {
  return new FoundrySceneViewport(() => globals);
}

describe('FoundryMovementCollisions', () => {
  it('offers the movement collision backend of the core', () => {
    const move = { testCollision: jest.fn() };
    const collisions = new FoundryMovementCollisions(() => ({ CONFIG: { Canvas: { polygonBackends: { move } } } }));

    expect(collisions.collisionTest()).toBe(move);
  });

  it.each([
    ['no CONFIG', {}],
    ['no canvas configuration', { CONFIG: {} }],
    ['no movement backend', { CONFIG: { Canvas: { polygonBackends: {} } } }]
  ])('has nothing to offer with %s', (_case, globals) => {
    expect(new FoundryMovementCollisions(() => globals).collisionTest()).toBeUndefined();
  });

  it('reads the globals on every call', () => {
    const globals = jest.fn().mockReturnValue({});
    const collisions = new FoundryMovementCollisions(globals);

    expect(globals).not.toHaveBeenCalled();
    collisions.collisionTest();
    collisions.collisionTest();
    expect(globals).toHaveBeenCalledTimes(2);
  });
});

describe('FoundrySceneViewport', () => {
  it('renders the stage and returns the canvas as a WebP image without the data-URL prefix', () => {
    const journal: Journal = [];

    const capture = viewportOver({ canvas: fakeCanvas(journal) }).capture();

    expect(capture).toEqual({
      sceneId: 'dungeon',
      sceneName: 'Dungeon',
      image: { data: 'QUJD', mimeType: 'image/webp', width: 1920, height: 1080 }
    });
    expect(journal).toEqual(['render stage', 'toDataURL(image/webp, 0.8)']);
  });

  it('draws the grid overlay for the capture only, and renders again once it is gone', () => {
    const journal: Journal = [];

    viewportOver({ canvas: fakeCanvas(journal), PIXI: fakePixi(journal) }).capture();

    const milestones = journal.filter((entry) => /^(stage\.|render|toDataURL|overlay\.destroy)/.test(entry));
    expect(milestones).toEqual([
      'stage.addChild gridOverlay',
      'render stage',
      'toDataURL(image/webp, 0.8)',
      'stage.removeChild gridOverlay',
      'overlay.destroy({"children":true})',
      'render stage'
    ]);
  });

  it('reports the format the browser fell back to, not the one it was asked for', () => {
    const canvas = fakeCanvas([]);
    canvas.app.view.toDataURL = () => 'data:image/png;base64,UE5H';

    expect(viewportOver({ canvas }).capture()?.image).toMatchObject({ data: 'UE5H', mimeType: 'image/png' });
  });

  it('keeps the requested format for an answer that does not say what it is', () => {
    const canvas = fakeCanvas([]);
    canvas.app.view.toDataURL = () => 'data:,';

    expect(viewportOver({ canvas }).capture()?.image).toMatchObject({ data: 'data:,', mimeType: 'image/webp' });
  });

  it.each([
    ['there is no canvas', (): FoundrySceneCanvasGlobals => ({})],
    ['the canvas is not ready', (): FoundrySceneCanvasGlobals => ({ canvas: fakeCanvas([], { ready: false }) })],
    ['no scene is drawn', (): FoundrySceneCanvasGlobals => ({ canvas: fakeCanvas([], { scene: null }) })]
  ])('captures nothing when %s', (_case, globals) => {
    expect(viewportOver(globals()).capture()).toBeNull();
  });

  it('touches neither the renderer nor PIXI when there is nothing to capture', () => {
    const journal: Journal = [];

    viewportOver({ canvas: fakeCanvas(journal, { ready: false }), PIXI: fakePixi(journal) }).capture();

    expect(journal).toEqual([]);
  });

  it('lets a rendering failure through', () => {
    const canvas = fakeCanvas([]);
    canvas.app.renderer.render = () => {
      throw new Error('WebGL context lost');
    };

    expect(() => viewportOver({ canvas }).capture()).toThrow('WebGL context lost');
  });

  describe('when the capture fails with the grid overlay on the stage', () => {
    const overlayTraces = (journal: Journal): string[] =>
      journal.filter((entry) => /^(stage\.|overlay\.destroy)/.test(entry));

    it('takes the overlay off when the renderer throws', () => {
      const journal: Journal = [];
      const canvas = fakeCanvas(journal);
      canvas.app.renderer.render = () => {
        journal.push('render fails');
        throw new Error('WebGL context lost');
      };

      expect(() => viewportOver({ canvas, PIXI: fakePixi(journal) }).capture()).toThrow('WebGL context lost');
      expect(overlayTraces(journal)).toEqual([
        'stage.addChild gridOverlay',
        'stage.removeChild gridOverlay',
        'overlay.destroy({"children":true})'
      ]);
      expect(journal.filter((entry) => entry === 'render fails')).toHaveLength(1);
    });

    it('takes the overlay off when the image cannot be read', () => {
      const journal: Journal = [];
      const canvas = fakeCanvas(journal);
      canvas.app.view.toDataURL = () => {
        throw new Error('Tainted canvases may not be exported');
      };

      expect(() => viewportOver({ canvas, PIXI: fakePixi(journal) }).capture()).toThrow('Tainted canvases');
      expect(overlayTraces(journal)).toEqual([
        'stage.addChild gridOverlay',
        'stage.removeChild gridOverlay',
        'overlay.destroy({"children":true})'
      ]);
    });
  });

  describe('viewedSceneId', () => {
    it('is the scene the canvas has drawn', () => {
      expect(viewportOver({ canvas: fakeCanvas([]) }).viewedSceneId()).toBe('dungeon');
    });

    it.each([
      ['there is no canvas', (): FoundrySceneCanvasGlobals => ({})],
      ['the canvas is still drawing the scene', (): FoundrySceneCanvasGlobals => ({ canvas: fakeCanvas([], { ready: false }) })],
      ['the canvas is blank', (): FoundrySceneCanvasGlobals => ({ canvas: fakeCanvas([], { scene: null }) })]
    ])('is null when %s', (_case, globals) => {
      expect(viewportOver(globals()).viewedSceneId()).toBeNull();
    });

    it('renders nothing', () => {
      const journal: Journal = [];

      viewportOver({ canvas: fakeCanvas(journal), PIXI: fakePixi(journal) }).viewedSceneId();

      expect(journal).toEqual([]);
    });
  });
});

describe('grid overlay', () => {
  function overlayCanvas(journal: Journal, scene: FoundryCanvasScene = canvasScene()): OverlayCanvas {
    return { scene, stage: fakeCanvas(journal).stage };
  }

  it('draws nothing without PIXI', () => {
    const journal: Journal = [];

    expect(addGridOverlay(overlayCanvas(journal), () => undefined)).toBeUndefined();
    expect(journal).toEqual([]);
  });

  it('labels every cell of the scene with its grid coordinates', () => {
    const journal: Journal = [];

    addGridOverlay(overlayCanvas(journal), () => fakePixi(journal));

    expect(journal.filter((entry) => entry.startsWith('label'))).toEqual(['label 0,0', 'label 1,0']);
  });

  it('starts at the cell the scene starts in when the scene is padded', () => {
    const journal: Journal = [];
    const padded = canvasScene({ dimensions: { sceneWidth: 100, sceneHeight: 200, sceneX: 300, sceneY: 100 } });

    addGridOverlay(overlayCanvas(journal, padded), () => fakePixi(journal));

    expect(journal.filter((entry) => entry.startsWith('label'))).toEqual(['label 3,1', 'label 3,2']);
  });

  it('rules a faint line along every cell border of the scene', () => {
    const journal: Journal = [];

    addGridOverlay(overlayCanvas(journal), () => fakePixi(journal));

    expect(journal.filter((entry) => /^(lineStyle|moveTo|lineTo)/.test(entry))).toEqual([
      'lineStyle(1, 16777215, 0.15)',
      'moveTo(0, 0)',
      'lineTo(0, 100)',
      'moveTo(100, 0)',
      'lineTo(100, 100)',
      'moveTo(200, 0)',
      'lineTo(200, 100)',
      'moveTo(0, 0)',
      'lineTo(200, 0)',
      'moveTo(0, 100)',
      'lineTo(200, 100)'
    ]);
  });

  it('sizes the label font to the cell', () => {
    const journal: Journal = [];
    const coarse = canvasScene({ grid: { size: 200 } });

    addGridOverlay(overlayCanvas(journal, coarse), () => fakePixi(journal));

    expect(journal.find((entry) => entry.startsWith('style'))).toBe(
      `style ${JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 44,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 7,
        letterSpacing: 0
      })}`
    );
  });

  it('adds the overlay to the stage and takes it off again', () => {
    const journal: Journal = [];
    const canvas = overlayCanvas(journal);

    const overlay = addGridOverlay(canvas, () => fakePixi(journal));
    if (overlay === undefined) {
      throw new Error('expected an overlay');
    }
    removeGridOverlay(canvas, overlay);

    expect(journal.filter((entry) => /^(stage\.|overlay\.destroy)/.test(entry))).toEqual([
      'stage.addChild gridOverlay',
      'stage.removeChild gridOverlay',
      'overlay.destroy({"children":true})'
    ]);
  });
});
