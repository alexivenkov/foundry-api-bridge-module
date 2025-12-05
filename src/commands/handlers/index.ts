export { rollDiceHandler } from '@/commands/handlers/RollDiceHandler';
export { rollSkillHandler, SKILL_KEYS, type SkillKey } from '@/commands/handlers/RollSkillHandler';
export { rollSaveHandler } from '@/commands/handlers/RollSaveHandler';
export { rollAbilityHandler } from '@/commands/handlers/RollAbilityHandler';
export { rollAttackHandler } from '@/commands/handlers/RollAttackHandler';
export { rollDamageHandler } from '@/commands/handlers/RollDamageHandler';

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