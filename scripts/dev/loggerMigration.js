// ========================================
// utils/loggerMigration.js - Migration vers le système unifié
// ========================================
import unifiedLogger from '../../utils/centralizedLogger.js';

// Redirection des anciens imports pour compatibilité
export const { logInfo } = unifiedLogger;
export const { logError } = unifiedLogger;
export const { logWarn } = unifiedLogger;
export const { logDebug } = unifiedLogger;

// Redirection des helpers console
export const { sectionStart } = unifiedLogger;
export const { summary } = unifiedLogger;
export const { custom } = unifiedLogger;
export const success = unifiedLogger.logSuccess;
export const infocmd = unifiedLogger.logCommand;
export const warn = unifiedLogger.logWarn;
export const error = unifiedLogger.logError;

// Export par défaut pour compatibilité
export default unifiedLogger;

// Message de migration
console.log('\n🔄 Migration vers le système de logging centralisé');
console.log('📝 Les anciens imports continuent de fonctionner');
console.log(
  '🎯 Utilisez maintenant: import logger from "./utils/centralizedLogger.js"\n'
);

