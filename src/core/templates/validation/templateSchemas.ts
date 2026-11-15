import { z } from 'zod';
import { MEASURED_TEMPLATE_TYPES } from '@/core/templates/domain';

// New commands without legacy clients: wrong types, out-of-enum values and
// out-of-range numbers are rejected; unknown keys are ignored. An addressing
// `sceneId` given as null or '' reads as absent. Ranges are the core's
// (`BaseMeasuredTemplate`, Foundry 13.351).

const sceneIdSchema = z.string().nullish();
const templateIdSchema = z.string().min(1);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a #rrggbb color');
const documentId = z.string().regex(/^[a-zA-Z0-9]{16}$/, 'Expected a 16-character document id');
const distanceSchema = z.number().positive();

const templateAttributesShape = {
  elevation: z.number().optional(),
  sort: z.number().int().optional(),
  direction: z.number().optional(),
  angle: z.number().min(0).max(360).optional(),
  width: z.number().min(0).optional(),
  borderColor: hexColor.optional(),
  fillColor: hexColor.optional(),
  texture: z.string().min(1).nullable().optional(),
  hidden: z.boolean().optional()
};

export const getTemplatesRequestSchema = z.object({
  sceneId: sceneIdSchema
});

export const createTemplateRequestSchema = z.object({
  sceneId: sceneIdSchema,
  type: z.enum(MEASURED_TEMPLATE_TYPES),
  x: z.number(),
  y: z.number(),
  distance: distanceSchema,
  authorId: documentId.optional(),
  ...templateAttributesShape
});

export const updateTemplateRequestSchema = z.object({
  sceneId: sceneIdSchema,
  templateId: templateIdSchema,
  type: z.enum(MEASURED_TEMPLATE_TYPES).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  distance: distanceSchema.optional(),
  ...templateAttributesShape
});

export const deleteTemplateRequestSchema = z.object({
  sceneId: sceneIdSchema,
  templateId: templateIdSchema
});

export type GetTemplatesRequest = z.infer<typeof getTemplatesRequestSchema>;
export type CreateTemplateRequest = z.infer<typeof createTemplateRequestSchema>;
export type UpdateTemplateRequest = z.infer<typeof updateTemplateRequestSchema>;
export type DeleteTemplateRequest = z.infer<typeof deleteTemplateRequestSchema>;
