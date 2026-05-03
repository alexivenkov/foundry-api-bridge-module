import { z } from 'zod';

// We accept both the canonical lowercase forms and the well-known aliases
// ('very rare' with a space, 'veryrare' without a separator). The
// RequestToQueryMapper feeds these directly into parseItemRarity which
// performs the same normalization on the domain side.
const VALID_RARITY_TOKENS: ReadonlySet<string> = new Set<string>([
  'common',
  'uncommon',
  'rare',
  'veryrare',
  'very rare',
  'legendary',
  'artifact'
]);

export const itemRarityArraySchema = z
  .array(
    z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .superRefine((val, ctx) => {
        if (!VALID_RARITY_TOKENS.has(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `unknown itemRarity: '${val}'`
          });
        }
      })
  )
  .nonempty({ message: 'rarity array must not be empty' });
