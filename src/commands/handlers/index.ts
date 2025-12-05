export { rollDiceHandler } from '@/commands/handlers/RollDiceHandler';

// Actor handlers
export {
  rollSkillHandler,
  SKILL_KEYS,
  type SkillKey,
  rollSaveHandler,
  rollAbilityHandler,
  rollAttackHandler,
  rollDamageHandler,
  createActorHandler,
  createActorFromCompendiumHandler,
  updateActorHandler,
  deleteActorHandler
} from '@/commands/handlers/actor';

// Journal handlers
export { createJournalHandler } from '@/commands/handlers/CreateJournalHandler';
export { updateJournalHandler } from '@/commands/handlers/UpdateJournalHandler';
export { deleteJournalHandler } from '@/commands/handlers/DeleteJournalHandler';
export { createJournalPageHandler } from '@/commands/handlers/CreateJournalPageHandler';
export { updateJournalPageHandler } from '@/commands/handlers/UpdateJournalPageHandler';
export { deleteJournalPageHandler } from '@/commands/handlers/DeleteJournalPageHandler';

// Combat handlers
export {
  createCombatHandler,
  addCombatantHandler,
  removeCombatantHandler,
  startCombatHandler,
  endCombatHandler,
  nextTurnHandler,
  previousTurnHandler,
  getCombatStateHandler,
  rollInitiativeHandler,
  setInitiativeHandler,
  rollAllInitiativeHandler,
  updateCombatantHandler,
  setCombatantDefeatedHandler,
  toggleCombatantVisibilityHandler
} from '@/commands/handlers/combat';

// Token handlers
export {
  createTokenHandler,
  deleteTokenHandler,
  moveTokenHandler,
  updateTokenHandler,
  getSceneTokensHandler
} from '@/commands/handlers/token';