// ========================================
// utils/loggerMigration.js - Migration vers le système unifié
// ========================================
import unifiedLogger from "./centralizedLogger.js";

// Redirection des anciens imports pour compatibilité
export const logInfo = unifiedLogger.logInfo;
export const logError = unifiedLogger.logError;
export const logWarn = unifiedLogger.logWarn;
export const logDebug = unifiedLogger.logDebug;

// Redirection des helpers console
export const sectionStart = unifiedLogger.sectionStart;
export const summary = unifiedLogger.summary;
export const custom = unifiedLogger.custom;
export const success = unifiedLogger.logSuccess;
export const infocmd = unifiedLogger.logCommand;
export const warn = unifiedLogger.logWarn;
export const error = unifiedLogger.logError;

// Export par défaut pour compatibilité
export default unifiedLogger;

// Message de migration
console.log("\n🔄 Migration vers le système de logging centralisé");
console.log("📝 Les anciens imports continuent de fonctionner");
console.log(
  '🎯 Utilisez maintenant: import logger from "./utils/centralizedLogger.js"\n'
);
