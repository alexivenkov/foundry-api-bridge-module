import { z } from 'zod';

export const importFromCompendiumRequestSchema = z.object({
  packId: z.string(),
  documentId: z.string(),
  name: z.string().optional(),
  folder: z.string().optional()
});

export type ImportFromCompendiumRequest = z.infer<
  typeof importFromCompendiumRequestSchema
>;

export const createActorFromCompendiumRequestSchema = z.object({
  packId: z.string(),
  actorId: z.string(),
  name: z.string().optional(),
  folder: z.string().optional()
});

export type CreateActorFromCompendiumRequest = z.infer<
  typeof createActorFromCompendiumRequestSchema
>;

export const createItemFromCompendiumRequestSchema = z.object({
  packId: z.string(),
  itemId: z.string(),
  name: z.string().optional(),
  folder: z.string().optional()
});

export type CreateItemFromCompendiumRequest = z.infer<
  typeof createItemFromCompendiumRequestSchema
>;

export const addItemFromCompendiumRequestSchema = z.object({
  actorId: z.string(),
  packId: z.string(),
  itemId: z.string(),
  name: z.string().optional(),
  quantity: z.number().optional()
});

export type AddItemFromCompendiumRequest = z.infer<
  typeof addItemFromCompendiumRequestSchema
>;
