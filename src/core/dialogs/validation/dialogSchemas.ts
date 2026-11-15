import { z } from 'zod';
import { MAX_TIMEOUT_SECONDS, MIN_TIMEOUT_SECONDS, PROMPT_INPUT_TYPES } from '@/core/dialogs/domain';

const MAX_DEFAULT_TEXT_LENGTH = 1000;

function plainText(max: number): z.ZodString {
  return z
    .string()
    .max(max)
    .refine((value) => value.trim() !== '', 'must not be blank');
}

const questionShape = {
  userId: z.string().min(1),
  title: plainText(100),
  content: plainText(2000),
  timeoutSeconds: z.number().int().min(MIN_TIMEOUT_SECONDS).max(MAX_TIMEOUT_SECONDS).optional()
};

const confirmRequestSchema = z.object({
  kind: z.literal('confirm'),
  ...questionShape,
  yesLabel: plainText(40).optional(),
  noLabel: plainText(40).optional()
});

const promptRequestSchema = z
  .object({
    kind: z.literal('prompt'),
    ...questionShape,
    inputType: z.enum(PROMPT_INPUT_TYPES).optional(),
    inputLabel: plainText(100).optional(),
    defaultValue: z.union([z.string().max(MAX_DEFAULT_TEXT_LENGTH), z.number()]).optional()
  })
  .refine(
    (request) =>
      request.defaultValue === undefined ||
      typeof request.defaultValue === (request.inputType === 'number' ? 'number' : 'string'),
    { message: 'must be a number for inputType number and a string for text', path: ['defaultValue'] }
  );

const choiceRequestSchema = z.object({
  kind: z.literal('choice'),
  ...questionShape,
  choices: z
    .array(plainText(60))
    .min(2)
    .max(10)
    .refine((choices) => new Set(choices).size === choices.length, 'must be distinct')
});

export const askUserRequestSchema = z.discriminatedUnion('kind', [
  confirmRequestSchema,
  promptRequestSchema,
  choiceRequestSchema
]);

export const questionRequestSchema = z.object({
  requestId: z.string().min(1)
});

export type AskUserRequest = z.infer<typeof askUserRequestSchema>;
export type QuestionRequest = z.infer<typeof questionRequestSchema>;
