import { z } from 'zod';
import { MACRO_SCOPES, MACRO_TYPES } from '@/core/macros/domain';

// As tolerant as the pre-DDD handlers were: unknown keys are ignored, and a new
// macro needs no more than a name — the core supplies the type and the command.

/** No macro has this type, so a listing filtered by it is empty. */
export const UNKNOWN_MACRO_TYPE = '';

// `get-macros` has always compared `type` with each macro's type as it came: a
// value that names no type lists nothing instead of failing, a non-string too.
export const getMacrosRequestSchema = z.object({
  type: z.string().optional().catch(UNKNOWN_MACRO_TYPE)
});

export const getMacroRequestSchema = z.object({
  macroId: z.string()
});

const macroAttributesShape = {
  type: z.enum(MACRO_TYPES).optional(),
  command: z.string().optional(),
  scope: z.enum(MACRO_SCOPES).optional(),
  img: z.string().optional(),
  folder: z.string().nullable().optional()
};

export const createMacroRequestSchema = z.object({
  name: z.string(),
  ...macroAttributesShape
});

// The core skips an update whose `type` or `scope` is outside its enum and the
// old handler answered success; an invalid value is therefore ignored here, not
// rejected. (On create the core cancels the creation, so there it stays an error.)
export const updateMacroRequestSchema = z.object({
  macroId: z.string(),
  name: z.string().optional(),
  ...macroAttributesShape,
  type: z.enum(MACRO_TYPES).optional().catch(undefined),
  scope: z.enum(MACRO_SCOPES).optional().catch(undefined)
});

export const deleteMacroRequestSchema = z.object({
  macroId: z.string()
});

// `args` is left unchecked here: it must be reported as "args must be a JSON
// object" only after the macro lookup and the script permission, and a parsed
// copy would not be the caller's own object any more.
export const executeMacroRequestSchema = z.object({
  macroId: z.string(),
  actorId: z.string().optional(),
  tokenId: z.string().optional(),
  args: z.unknown()
});

export type GetMacrosRequest = z.infer<typeof getMacrosRequestSchema>;
export type GetMacroRequest = z.infer<typeof getMacroRequestSchema>;
export type CreateMacroRequest = z.infer<typeof createMacroRequestSchema>;
export type UpdateMacroRequest = z.infer<typeof updateMacroRequestSchema>;
export type DeleteMacroRequest = z.infer<typeof deleteMacroRequestSchema>;
export type ExecuteMacroRequest = z.infer<typeof executeMacroRequestSchema>;
