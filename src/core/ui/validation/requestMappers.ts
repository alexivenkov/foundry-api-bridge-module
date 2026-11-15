import type {
  MeasureGridPathCommand,
  NotifyCommand,
  PanCanvasCommand,
  PingLocationCommand,
  RemoveNotificationCommand,
  ShowScrollingTextCommand,
  SnapToGridCommand,
  StartProgressCommand,
  UpdateProgressCommand
} from '@/core/ui/application';
import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateProgressNotificationRequest,
  MeasureGridPathRequest,
  NotifyRequest,
  PanCanvasRequest,
  PingLocationRequest,
  RemoveNotificationRequest,
  ShowScrollingTextRequest,
  SnapToGridRequest,
  UpdateProgressNotificationRequest
} from './uiSchemas';

export function toNotifyCommand(request: NotifyRequest): NotifyCommand {
  return {
    notification: {
      message: request.message,
      level: request.type ?? 'info',
      permanent: request.permanent,
      console: request.console
    }
  };
}

export function toPanCanvasCommand(request: PanCanvasRequest): PanCanvasCommand {
  return {
    pan: { x: request.x, y: request.y, scale: request.scale, duration: request.duration }
  };
}

export function toPingLocationCommand(request: PingLocationRequest): PingLocationCommand {
  return {
    ping: {
      x: request.x,
      y: request.y,
      style: request.style,
      color: request.color,
      duration: request.duration
    }
  };
}

export function toStartProgressCommand(request: CreateProgressNotificationRequest): StartProgressCommand {
  return {
    progress: {
      message: request.message,
      level: request.type ?? 'info',
      pct: request.pct,
      permanent: request.permanent,
      console: request.console
    }
  };
}

export function toUpdateProgressCommand(request: UpdateProgressNotificationRequest): UpdateProgressCommand {
  return {
    notificationId: request.notificationId,
    update: { message: request.message, pct: request.pct }
  };
}

export function toRemoveNotificationCommand(request: RemoveNotificationRequest): RemoveNotificationCommand {
  return { notificationId: request.notificationId };
}

export function toMeasureGridPathCommand(request: MeasureGridPathRequest): MeasureGridPathCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    waypoints: request.waypoints.map((waypoint) => ({
      x: waypoint.x,
      y: waypoint.y,
      elevation: waypoint.elevation,
      teleport: waypoint.teleport
    }))
  };
}

export function toSnapToGridCommand(request: SnapToGridRequest): SnapToGridCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    point: { x: request.x, y: request.y },
    snapping: {
      modes: Array.isArray(request.mode) ? request.mode : [request.mode],
      resolution: request.resolution ?? 1
    }
  };
}

export function toShowScrollingTextCommand(request: ShowScrollingTextRequest): ShowScrollingTextCommand {
  return {
    text: {
      origin: { x: request.x, y: request.y },
      text: request.text,
      color: request.color,
      fontSize: request.fontSize,
      anchor: request.anchor,
      direction: request.direction,
      duration: request.duration,
      jitter: request.jitter
    }
  };
}
