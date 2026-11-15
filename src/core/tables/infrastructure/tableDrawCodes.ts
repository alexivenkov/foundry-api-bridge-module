import { isV14Plus } from '@/compat/foundryVersion';
import type { TableDrawVisibility } from '@/core/tables/domain';
import type { FoundryTableDrawOptions } from './foundryRollTableTypes';

// CONST.DICE_ROLL_MODES up to Foundry 13 (13.351). Foundry 14 (14.368) takes a
// key of CONFIG.ChatMessage.modes as `messageMode` instead and only maps a
// `rollMode` with a deprecation warning; its keys are the domain's own words.
const ROLL_MODE: Readonly<Record<TableDrawVisibility, string>> = {
  public: 'publicroll',
  gm: 'gmroll',
  blind: 'blindroll',
  self: 'selfroll'
};

export function toDrawVisibilityOption(
  visibility: TableDrawVisibility | undefined
): Pick<FoundryTableDrawOptions, 'rollMode' | 'messageMode'> {
  if (visibility === undefined) {
    return {};
  }
  return isV14Plus() ? { messageMode: visibility } : { rollMode: ROLL_MODE[visibility] };
}
