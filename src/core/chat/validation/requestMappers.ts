import type {
  DeleteChatMessageCommand,
  ExportChatQuery,
  ListChatMessagesQuery,
  RollDiceCommand,
  SendChatMessageCommand,
  SimulateRollQuery,
  UpdateChatMessageCommand,
  ValidateRollFormulaQuery
} from '@/core/chat/application';
import { DEFAULT_SIMULATIONS } from '@/core/chat/domain';
import { emptyAsAbsent, toActorTarget, type ActorTarget } from '@/core/shared';
import type {
  DeleteChatMessageRequest,
  ExportChatRequest,
  GetChatMessagesRequest,
  RollDiceRequest,
  SendChatMessageRequest,
  SimulateRollRequest,
  UpdateChatMessageRequest,
  ValidateRollFormulaRequest
} from './chatSchemas';

interface RollerRequest {
  actorId?: string | null | undefined;
  tokenId?: string | null | undefined;
  sceneId?: string | null | undefined;
}

/** None when the request names neither an actor nor a token; a token id wins. */
function toRoller(request: RollerRequest): ActorTarget | undefined {
  const tokenId = emptyAsAbsent(request.tokenId);
  const actorId = emptyAsAbsent(request.actorId);
  if (tokenId === undefined && actorId === undefined) {
    return undefined;
  }
  return toActorTarget({ tokenId, actorId, sceneId: emptyAsAbsent(request.sceneId) });
}

export function toRollDiceCommand(request: RollDiceRequest): RollDiceCommand {
  return {
    formula: request.formula,
    showInChat: Boolean(request.showInChat),
    flavor: request.flavor,
    visibility: request.visibility,
    roller: toRoller(request),
    alias: request.alias,
    data: request.data
  };
}

export function toSendChatMessageCommand(request: SendChatMessageRequest): SendChatMessageCommand {
  const tokenId = emptyAsAbsent(request.tokenId);
  return {
    content: request.content,
    actorId: emptyAsAbsent(request.actorId),
    // Kept even when empty: for a missing actor an empty name still replaces the default alias.
    speakerName: request.speaker ?? undefined,
    flavor: emptyAsAbsent(request.flavor),
    whisperTo: request.whisperTo ?? [],
    style: request.type ?? undefined,
    visibility: request.visibility,
    recipients: request.recipients,
    speakerToken: tokenId !== undefined ? { tokenId, sceneId: emptyAsAbsent(request.sceneId) } : undefined,
    alias: request.alias
  };
}

export function toValidateRollFormulaQuery(request: ValidateRollFormulaRequest): ValidateRollFormulaQuery {
  return { formula: request.formula, roller: toRoller(request), data: request.data };
}

export function toSimulateRollQuery(request: SimulateRollRequest): SimulateRollQuery {
  return {
    formula: request.formula,
    iterations: request.iterations ?? DEFAULT_SIMULATIONS,
    roller: toRoller(request),
    data: request.data
  };
}

export function toListChatMessagesQuery(request: GetChatMessagesRequest): ListChatMessagesQuery {
  return {
    filter: {
      limit: request.limit ?? undefined,
      since: emptyAsAbsent(request.since),
      before: emptyAsAbsent(request.before),
      authorId: emptyAsAbsent(request.authorId),
      actorId: emptyAsAbsent(request.actorId),
      kind: request.type ?? undefined,
      search: emptyAsAbsent(request.search)
    },
    includeRolls: request.includeRolls === true
  };
}

export function toUpdateChatMessageCommand(request: UpdateChatMessageRequest): UpdateChatMessageCommand {
  return {
    messageId: request.messageId,
    changes: { content: request.content, flavor: request.flavor }
  };
}

export function toDeleteChatMessageCommand(request: DeleteChatMessageRequest): DeleteChatMessageCommand {
  return { messageId: request.messageId };
}

export function toExportChatQuery(request: ExportChatRequest): ExportChatQuery {
  return { format: request.format ?? 'text' };
}
