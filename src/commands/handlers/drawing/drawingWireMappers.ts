import type { DrawingResult, DrawingSummary } from '@/commands/types';
import type { Drawing, SceneDrawingResult } from '@/core/drawings';

export function toWireDrawing(drawing: Drawing): DrawingSummary {
  return {
    id: drawing.id,
    ...(drawing.name !== undefined ? { name: drawing.name } : {}),
    authorId: drawing.authorId,
    x: drawing.x,
    y: drawing.y,
    shape: {
      type: drawing.shape.type,
      width: drawing.shape.width,
      height: drawing.shape.height,
      points: [...drawing.shape.points]
    },
    elevation: drawing.elevation,
    sort: drawing.sort,
    rotation: drawing.rotation,
    bezierFactor: drawing.bezierFactor,
    fill: { ...drawing.fill },
    stroke: { ...drawing.stroke },
    text: { ...drawing.text },
    hidden: drawing.hidden,
    locked: drawing.locked,
    interface: drawing.interface,
    ...(drawing.levels !== undefined ? { levels: [...drawing.levels] } : {})
  };
}

export function toDrawingResult(result: SceneDrawingResult): DrawingResult {
  return { ...toWireDrawing(result.drawing), sceneId: result.sceneId };
}
