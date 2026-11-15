import type { ShowSpeechBubbleParams, ShowSpeechBubbleResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTokenCanvasService,
  showSpeechBubbleRequestSchema,
  toShowSpeechBubbleCommand,
  type TokenCanvasWiring
} from '@/core/tokens';

export function createShowSpeechBubbleHandler(
  deps: TokenCanvasWiring = {}
): (params: ShowSpeechBubbleParams) => Promise<ShowSpeechBubbleResult> {
  const service = createFoundryTokenCanvasService(deps);

  return async function showSpeechBubbleHandler(params: ShowSpeechBubbleParams): Promise<ShowSpeechBubbleResult> {
    const result = await service.showSpeechBubble(toShowSpeechBubbleCommand(parseRequest(showSpeechBubbleRequestSchema, params)));
    return { sceneId: result.sceneId, tokenId: result.tokenId, shownHere: result.shownHere };
  };
}

export const showSpeechBubbleHandler = createShowSpeechBubbleHandler();
