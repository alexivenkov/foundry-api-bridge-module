import { emptyAsAbsent } from '@/core/shared';
import type { SelectTokensCommand, SetTargetsCommand, ShowSpeechBubbleCommand } from '@/core/tokens/application';
import type { SelectTokensRequest, SetTargetsRequest, ShowSpeechBubbleRequest } from './canvasSchemas';

export function toSelectTokensCommand(request: SelectTokensRequest): SelectTokensCommand {
  return { tokenIds: [...new Set(request.tokenIds)], releaseOthers: request.releaseOthers !== false };
}

export function toSetTargetsCommand(request: SetTargetsRequest): SetTargetsCommand {
  return { tokenIds: [...new Set(request.tokenIds)] };
}

export function toShowSpeechBubbleCommand(request: ShowSpeechBubbleRequest): ShowSpeechBubbleCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    tokenId: request.tokenId,
    text: request.text,
    options: { pan: request.pan !== false, requireVisible: request.requireVisible === true }
  };
}
