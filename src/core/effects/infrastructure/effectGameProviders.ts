import type { GameProvider } from '@/core/shared';
import type { FoundryEffectDocumentGame, FoundryEffectGame, FoundryEffectsGame } from './foundryEffectTypes';

export type EffectStoreGameProvider = GameProvider<FoundryEffectGame>;
export type EffectDocumentGameProvider = GameProvider<FoundryEffectDocumentGame>;
export type EffectRegistryGameProvider = GameProvider<Pick<FoundryEffectDocumentGame, 'documentTypes'>>;

/** The provider the context's services share: the real `game` serves all of them. */
export type EffectGameProvider = GameProvider<FoundryEffectsGame>;
