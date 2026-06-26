import type { CastSpellParams, CastSpellResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eItemUseService,
  Pf2eItemUseGateway,
  getPf2eItemUseGame,
  castSpellRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/item-use';

export async function pf2eCastSpellHandler(params: CastSpellParams): Promise<CastSpellResult> {
  requireSystem('pf2e', 'pf2e/cast-spell');

  const parsed = castSpellRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toCastSpellCommand(parsed.data);

  const gateway = new Pf2eItemUseGateway(getPf2eItemUseGame());
  const service = createPf2eItemUseService({ itemUse: gateway });

  const outcome = await service.castSpell(command);
  return {
    spellId: outcome.spellId,
    spellName: outcome.spellName,
    rank: outcome.rank,
    cast: true
  };
}
