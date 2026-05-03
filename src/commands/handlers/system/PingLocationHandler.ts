import type { PingLocationParams, PingLocationResult } from '@/commands/types';
import { getCanvas } from './systemTypes';

export async function pingLocationHandler(params: PingLocationParams): Promise<PingLocationResult> {
  const opts: Record<string, unknown> = {};
  if (params.style !== undefined) opts['style'] = params.style;
  if (params.color !== undefined) opts['color'] = params.color;
  if (params.duration !== undefined) opts['duration'] = params.duration;

  await getCanvas().ping({ x: params.x, y: params.y }, opts);
  return { pinged: true, x: params.x, y: params.y };
}
