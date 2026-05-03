import type { PanCanvasParams, PanCanvasResult } from '@/commands/types';
import { getCanvas } from './systemTypes';

export async function panCanvasHandler(params: PanCanvasParams): Promise<PanCanvasResult> {
  const data: Record<string, unknown> = {};
  if (params.x !== undefined) data['x'] = params.x;
  if (params.y !== undefined) data['y'] = params.y;
  if (params.scale !== undefined) data['scale'] = params.scale;
  if (params.duration !== undefined) data['duration'] = params.duration;

  await getCanvas().animatePan(data);
  return { panned: true };
}
