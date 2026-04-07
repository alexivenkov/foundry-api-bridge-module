interface PixiTextStyle {
  fontFamily: string;
  fontSize: number;
  fill: number;
  stroke: number;
  strokeThickness: number;
  letterSpacing: number;
}

interface PixiDisplayObject {
  x: number;
  y: number;
  alpha: number;
  name: string;
}

interface PixiText extends PixiDisplayObject {
  text: string;
}

interface PixiGraphics extends PixiDisplayObject {
  lineStyle(width: number, color: number, alpha: number): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
}

interface PixiContainer extends PixiDisplayObject {
  addChild(child: PixiDisplayObject): void;
  destroy(options?: { children?: boolean }): void;
}

interface PixiStage extends PixiContainer {
  removeChild(child: PixiDisplayObject): void;
}

interface PixiConstructors {
  Container: new () => PixiContainer;
  Graphics: new () => PixiGraphics;
  Text: new (text: string, style: PixiTextStyle) => PixiText;
  TextStyle: new (options: PixiTextStyle) => PixiTextStyle;
}

interface SceneDimensions {
  sceneWidth: number;
  sceneHeight: number;
  sceneX: number;
  sceneY: number;
}

export interface OverlayCanvas {
  scene: {
    grid: { size: number };
    dimensions: SceneDimensions;
  };
  stage: PixiStage;
}

const FONT_SIZE_RATIO = 0.22;
const PADDING_RATIO = 0.05;
const LINE_ALPHA = 0.15;
const TEXT_ALPHA = 0.65;
const STROKE_RATIO = 0.15;
const MIN_STROKE = 2;

function getPixi(): PixiConstructors | undefined {
  return (globalThis as unknown as { PIXI?: PixiConstructors }).PIXI;
}

export function addGridOverlay(canvas: OverlayCanvas): PixiContainer | undefined {
  const PIXI = getPixi();
  if (!PIXI) return undefined;

  const gridSize = canvas.scene.grid.size;
  const dims = canvas.scene.dimensions;
  const fontSize = Math.round(gridSize * FONT_SIZE_RATIO);
  const padding = Math.round(gridSize * PADDING_RATIO);

  const overlay = new PIXI.Container();
  overlay.name = 'gridOverlay';

  const startGX = Math.floor(dims.sceneX / gridSize);
  const startGY = Math.floor(dims.sceneY / gridSize);
  const endGX = Math.ceil((dims.sceneX + dims.sceneWidth) / gridSize);
  const endGY = Math.ceil((dims.sceneY + dims.sceneHeight) / gridSize);

  const lines = new PIXI.Graphics();
  lines.lineStyle(1, 0xFFFFFF, LINE_ALPHA);

  for (let gx = startGX; gx <= endGX; gx++) {
    const x = gx * gridSize;
    lines.moveTo(x, dims.sceneY);
    lines.lineTo(x, dims.sceneY + dims.sceneHeight);
  }
  for (let gy = startGY; gy <= endGY; gy++) {
    const y = gy * gridSize;
    lines.moveTo(dims.sceneX, y);
    lines.lineTo(dims.sceneX + dims.sceneWidth, y);
  }
  overlay.addChild(lines);

  const style = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize,
    fill: 0xFFFFFF,
    stroke: 0x000000,
    strokeThickness: Math.max(MIN_STROKE, Math.round(fontSize * STROKE_RATIO)),
    letterSpacing: 0
  });

  for (let gx = startGX; gx < endGX; gx++) {
    for (let gy = startGY; gy < endGY; gy++) {
      const text = new PIXI.Text(`${String(gx)},${String(gy)}`, style);
      text.x = gx * gridSize + padding;
      text.y = gy * gridSize + padding;
      text.alpha = TEXT_ALPHA;
      overlay.addChild(text);
    }
  }

  canvas.stage.addChild(overlay);
  return overlay;
}

export function removeGridOverlay(canvas: OverlayCanvas, overlay: PixiContainer): void {
  canvas.stage.removeChild(overlay);
  overlay.destroy({ children: true });
}
