import { z } from 'zod';
import { MAX_SPEECH_BUBBLE_LENGTH } from '@/core/tokens/domain';

const MAX_TOKENS = 200;
const tokenIds = z.array(z.string().min(1)).max(MAX_TOKENS);

export const selectTokensRequestSchema = z.object({ tokenIds, releaseOthers: z.boolean().optional() });

export const setTargetsRequestSchema = z.object({ tokenIds });

export const showSpeechBubbleRequestSchema = z.object({
  sceneId: z.string().nullish(),
  tokenId: z.string().min(1),
  text: z.string().trim().min(1).max(MAX_SPEECH_BUBBLE_LENGTH),
  pan: z.boolean().optional(),
  requireVisible: z.boolean().optional()
});

export type SelectTokensRequest = z.infer<typeof selectTokensRequestSchema>;
export type SetTargetsRequest = z.infer<typeof setTargetsRequestSchema>;
export type ShowSpeechBubbleRequest = z.infer<typeof showSpeechBubbleRequestSchema>;
