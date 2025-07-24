// ========================================
// bot/events/handlers/CommandTypeHandler.js
// - Détermine le type de commande à partir de son nom
// ========================================

/**
 * Renvoie un type de commande basé sur le nom ou l’identifiant de l’interaction.
 * Peut être utilisé pour les métriques, le rate limiting, etc.
 */
export function getCommandType(commandName = '') {
    if (commandName.startsWith('suggestion_')) return 'BUTTON_SUGGESTION';
    if (commandName === 'schedule_fr' || commandName === 'schedule_en') return 'BUTTON_SCHEDULE';
    if (commandName === 'show_full_stats') return 'BUTTON_STATS';
  
    if (typeof commandName === 'string') {
      if (commandName.match(/^(play|pause|skip|volume)/)) return 'SLASH_MUSIC';
      if (commandName.match(/^(ban|kick|warn)/)) return 'SLASH_MODERATION';
    }
  
    return 'UNKNOWN';
  }
  