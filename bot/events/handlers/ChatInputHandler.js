// ========================================
// bot/events/handlers/ChatInputHandler.js - Gestion des commandes slash
// ========================================

import logger from '../../logger.js';

/**
 * Traiter une commande slash
 */
export async function handleChatInputCommand (interaction, _client, _db, _config) {
  const { commandName } = interaction;

  // Liste des commandes qui ont des fichiers dédiés
  const commandsWithFiles = [
    'ping',
    'drink',
    'force',
    'play',
    'stop',
    'nowplaying',
    'stats',
    'getwallpaper',
    'schedule',
    'suggest',
    'suggest-delete',
    'suggest-edit',
    'list_suggestions',
    'silence'
  ];

  // Si la commande a un fichier dédié, l'utiliser
  if (commandsWithFiles.includes(commandName)) {
    try {
      const commandFile = await import(
        `../../commands/${
          commandName === 'list_suggestions' ? 'suggest-list' : commandName
        }.js`
      );
      return await commandFile.default.execute(interaction);
    } catch (error) {
      logger.error(`Erreur dans la commande ${commandName}:`, error);
      return {
        success: false,
        message: `❌ Erreur lors de l'exécution de la commande ${commandName}.`,
        ephemeral: true
      };
    }
  }

  // Commandes qui n'ont pas de fichiers dédiés (à traiter ici)
  switch (commandName) {
  case 'help':
    return {
      success: true,
      message:
          '📚 **Commandes disponibles:**\n'
          + '• `/ping` - Vérifier la latence\n'
          + '• `/drink <utilisateur>` - Offrir un verre à quelqu\'un\n'
          + '• `/force <on/off>` - Activer/désactiver la Force\n'
          + '• `/play` - Lancer le stream dans un Stage Channel\n'
          + '• `/stop` - Arrêter le stream\n'
          + '• `/nowplaying` - Voir le statut actuel\n'
          + '• `/stats` - Voir les statistiques du bot\n'
          + '• `/suggest <titre> <artiste>` - Proposer une suggestion\n'
          + '• `/suggest-delete <id>` - Supprimer une suggestion\n'
          + '• `/suggest-edit <id>` - Modifier une suggestion\n'
          + '• `/list_suggestions` - Voir toutes les suggestions\n'
          + '• `/getwallpaper` - Récupérer un wallpaper aléatoire\n'
          + '• `/schedule` - Afficher l\'horaire des programmes\n'
          + '• `/help` - Afficher cette aide',
      ephemeral: false
    };

  default:
    return {
      success: false,
      message: 'Commande non reconnue'
    };
  }
}
