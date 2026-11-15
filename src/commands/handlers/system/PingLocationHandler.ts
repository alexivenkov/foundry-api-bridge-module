import type { PingLocationParams, PingLocationResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryCanvasViewService, pingLocationRequestSchema, toPingLocationCommand } from '@/core/ui';
import type { CanvasViewHandlerDependencies } from './PanCanvasHandler';

export function createPingLocationHandler(
  deps: CanvasViewHandlerDependencies = {}
): (params: PingLocationParams) => Promise<PingLocationResult> {
  const service = createFoundryCanvasViewService(deps.canvas);

  return async function pingLocationHandler(params: PingLocationParams): Promise<PingLocationResult> {
    const command = toPingLocationCommand(parseRequest(pingLocationRequestSchema, params));
    const pinged = await service.pingLocation(command);
    return { pinged, x: command.ping.x, y: command.ping.y };
  };
}

export const pingLocationHandler = createPingLocationHandler();
