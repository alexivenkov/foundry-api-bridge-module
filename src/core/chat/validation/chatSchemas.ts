import { z } from 'zod';
import {
  CHAT_EXPORT_FORMATS,
  CHAT_MESSAGE_KINDS,
  CHAT_VISIBILITIES,
  MAX_SIMULATIONS,
  SPOKEN_STYLES
} from '@/core/chat/domain';

// Deliberately tolerant, as the pre-DDD handlers were. Unknown keys are ignored.
// A `type` / `format` outside its enum is ignored rather than rejected. Fields
// the old handlers tested for truthiness may be empty or null, which reads as
// "not given"; fields they handed to the core as given may be null.
// Fields added since are validated strictly, except that an addressing id
// given as null or '' reads as not given.

const blankable = z.string().nullish();
const passedThrough = z.string().nullable().optional();

const addressingId = z.string().nullish();
const visibility = z.enum(CHAT_VISIBILITIES).optional();
const alias = z.string().min(1).optional();
const rollData = z.record(z.string(), z.unknown()).optional();

export const rollDiceRequestSchema = z.object({
  formula: z.string(),
  showInChat: z.unknown().optional(),
  flavor: passedThrough,
  visibility,
  actorId: addressingId,
  tokenId: addressingId,
  sceneId: addressingId,
  alias,
  data: rollData
});

export const sendChatMessageRequestSchema = z.object({
  content: z.string(),
  speaker: blankable,
  actorId: blankable,
  flavor: blankable,
  whisperTo: z.array(z.string()).nullish(),
  type: z.enum(SPOKEN_STYLES).nullish().catch(undefined),
  visibility,
  recipients: z.array(z.string().trim().min(1)).optional(),
  tokenId: addressingId,
  sceneId: addressingId,
  alias
});

export const validateRollFormulaRequestSchema = z.object({
  formula: z.string(),
  actorId: addressingId,
  tokenId: addressingId,
  sceneId: addressingId,
  data: rollData
});

export const simulateRollRequestSchema = validateRollFormulaRequestSchema.extend({
  iterations: z.number().int().min(1).max(MAX_SIMULATIONS).optional()
});

export const getChatMessagesRequestSchema = z.object({
  // Coerced like the arithmetic it used to go through: "5" is five messages.
  // Anything that is not a number falls back to the default limit.
  limit: z.coerce.number().nullish().catch(undefined),
  // An id that matches no message has never narrowed the list, whatever its type.
  since: blankable.catch(undefined),
  before: blankable.catch(undefined),
  includeRolls: z.unknown().optional(),
  authorId: blankable,
  actorId: blankable,
  type: z.enum(CHAT_MESSAGE_KINDS).nullish().catch(undefined),
  search: blankable
});

export const deleteChatMessageRequestSchema = z.object({
  messageId: z.string()
});

export const updateChatMessageRequestSchema = z.object({
  messageId: z.string(),
  content: passedThrough,
  flavor: passedThrough
});

export const exportChatRequestSchema = z.object({
  format: z.enum(CHAT_EXPORT_FORMATS).nullish().catch(undefined)
});

export type RollDiceRequest = z.infer<typeof rollDiceRequestSchema>;
export type SendChatMessageRequest = z.infer<typeof sendChatMessageRequestSchema>;
export type ValidateRollFormulaRequest = z.infer<typeof validateRollFormulaRequestSchema>;
export type SimulateRollRequest = z.infer<typeof simulateRollRequestSchema>;
export type GetChatMessagesRequest = z.infer<typeof getChatMessagesRequestSchema>;
export type DeleteChatMessageRequest = z.infer<typeof deleteChatMessageRequestSchema>;
export type UpdateChatMessageRequest = z.infer<typeof updateChatMessageRequestSchema>;
export type ExportChatRequest = z.infer<typeof exportChatRequestSchema>;
