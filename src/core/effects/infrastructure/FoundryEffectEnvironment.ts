import { foundryGeneration } from '@/compat/foundryVersion';
import type { EffectEnvironment, EffectFeatures } from '@/core/effects/domain';
import type { EffectRegistryGameProvider } from './effectGameProviders';
import { LEGACY_CHANGE_MODES } from './effectCodes';
import { effectFeaturesFor } from './effectFeatures';
import type { FoundryEffectGlobals } from './foundryEffectTypes';

export type EffectGlobalsProvider = () => FoundryEffectGlobals;

const fromGlobalThis: EffectGlobalsProvider = () => globalThis as unknown as FoundryEffectGlobals;

function withRegistered(core: readonly string[] | undefined, registered: object | undefined): readonly string[] | null {
  if (core === undefined) {
    return null;
  }
  return [...new Set([...core, ...Object.keys(registered ?? {})])];
}

/**
 * Foundry 14 compiles its change types, phases and expiry events from `CONST`
 * plus what packages register in `CONFIG.ActiveEffect` (`ActiveEffect.CHANGE_TYPES`
 * / `CHANGE_PHASES` / `EXPIRY_EVENTS`); Foundry 13 knows the six change modes of
 * `CONST.ACTIVE_EFFECT_MODES` and nothing else. Subtypes come from
 * `game.documentTypes.ActiveEffect`, origins are checked by the schema field
 * itself (a `DocumentUUIDField` on 14, a plain string on 13).
 */
export class FoundryEffectEnvironment implements EffectEnvironment {
  constructor(
    private readonly gameProvider: EffectRegistryGameProvider,
    private readonly globals: EffectGlobalsProvider = fromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  features(): EffectFeatures {
    return effectFeaturesFor(this.generation());
  }

  effectTypes(): readonly string[] | null {
    return this.gameProvider.getGame().documentTypes?.['ActiveEffect'] ?? null;
  }

  changeTypes(): readonly string[] | null {
    if (!this.features().changePhases) {
      return Object.keys(LEGACY_CHANGE_MODES);
    }
    const { CONST, CONFIG } = this.globals();
    const core = CONST?.ACTIVE_EFFECT_CHANGE_TYPES;
    return withRegistered(core ? Object.keys(core) : undefined, CONFIG?.ActiveEffect?.changeTypes);
  }

  changePhases(): readonly string[] | null {
    const { CONST, CONFIG } = this.globals();
    return withRegistered(CONST?.ACTIVE_EFFECT_CHANGE_PHASES, CONFIG?.ActiveEffect?.phases);
  }

  expiryEvents(): readonly string[] | null {
    const { CONST, CONFIG } = this.globals();
    return withRegistered(CONST?.ACTIVE_EFFECT_EXPIRY_EVENTS, CONFIG?.ActiveEffect?.expiryEvents);
  }

  originProblem(origin: string): string | null {
    const field = this.globals().CONFIG?.ActiveEffect?.documentClass?.schema?.fields?.origin;
    if (field === undefined) {
      return null;
    }
    try {
      const failure = field.validate(origin);
      if (!failure) {
        return null;
      }
      return typeof failure.message === 'string' && failure.message !== '' ? failure.message : 'not a document UUID';
    } catch (error) {
      return error instanceof Error ? error.message : 'not a document UUID';
    }
  }
}
