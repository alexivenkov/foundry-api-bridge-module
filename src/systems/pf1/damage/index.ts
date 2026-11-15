export { Pf1DamageGateway, readPf1Health, usesWoundsAndVigor, getPf1DamageGame } from './infrastructure';
export type { FoundryPf1DamageGame } from './infrastructure';
export { createPf1DamageService, Pf1DamageService } from './application';
export type { Pf1DamageServiceDependencies, ApplyDamageCommand } from './application';
export {
  applyDamageRequestSchema,
  EXACTLY_ONE_OF_DAMAGE_OR_HEAL,
  REDUCTION_ONLY_FOR_DAMAGE,
  RequestToCommandMapper
} from './validation';
export type { Pf1HealthState, Pf1ApplyDamageOutcome, Pf1DamagePort, ApplyDamageOptions } from './domain';
