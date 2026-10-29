export { SwadeDamageGateway, previewDamage, snapshotDamageTarget, getSwadeDamageGame } from './infrastructure';
export type { DamageTargetSnapshot, FoundrySwadeDamageGame } from './infrastructure';
export { createSwadeDamageService, SwadeDamageService } from './application';
export type { SwadeDamageServiceDependencies, ApplyDamageCommand, SoakCommand } from './application';
export { applyDamageRequestSchema, soakRequestSchema, RequestToCommandMapper } from './validation';
export { computeDamage } from './domain';
export type {
  SwadeDamageRuleInput,
  SwadeDamagePreview,
  SwadeDamageOutcomeKind,
  SwadeApplyDamageOutcome,
  SwadeSoakOutcome,
  SwadeDamagePort
} from './domain';
