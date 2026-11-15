import { z } from 'zod';
import { SETTING_SCOPES } from '@/core/settings/domain';

const nameSchema = z.string().min(1);

export const getSettingsRequestSchema = z.object({
  namespace: z.string().nullish(),
  scope: z.enum(SETTING_SCOPES).nullish()
});

export const getSettingRequestSchema = z.object({
  namespace: nameSchema,
  key: nameSchema
});

// The value is checked against the registered setting by the domain and the core;
// here it only has to be present (`null` is a value).
export const setSettingRequestSchema = z.object({
  namespace: nameSchema,
  key: nameSchema,
  value: z.unknown().refine((value) => value !== undefined, { message: 'is required' })
});

export type GetSettingsRequest = z.infer<typeof getSettingsRequestSchema>;
export type GetSettingRequest = z.infer<typeof getSettingRequestSchema>;
export type SetSettingRequest = z.infer<typeof setSettingRequestSchema>;
