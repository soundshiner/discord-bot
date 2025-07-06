// ========================================
// bot/events/interactionCreate.js - Gestionnaire d'interactions optimisé
// ========================================

import { MessageFlags, InteractionType } from "discord.js";
import handlePlaylistSelect from "../handlers/handlePlaylistSelect.js";
import logger from "../logger.js";
import monitor from "../../core/monitor.js";

// Validation des interactions
function isValidInteraction(interaction) {
  return (
    interaction &&
    typeof interaction.isCommand === "function" &&
    typeof interaction.reply === "function"
  );
}

// Gestionnaire de commandes avec retry
async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Commande non trouvée: ${interaction.commandName}`);
    await interaction.reply({
      content: "❌ Cette commande n'existe pas ou n'est plus disponible.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Validation de la commande
  if (typeof command.execute !== "function") {
    logger.error(
      `Commande invalide: ${interaction.commandName} - méthode execute manquante`
    );
    await interaction.reply({
      content: "❌ Erreur interne: commande mal configurée.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Log de l'exécution
  logger.command(
    `Exécution de la commande: ${interaction.commandName} par ${interaction.user.tag}`
  );

  try {
    // Mesurer le temps d'exécution
    const startTime = Date.now();

    await command.execute(interaction);

    const executionTime = Date.now() - startTime;
    logger.success(
      `Commande ${interaction.commandName} exécutée en ${executionTime}ms`
    );
  } catch (error) {
    // Gestion d'erreur centralisée
    await monitor.handleCommandError(error, interaction);

    // Log détaillé pour le debugging
    logger.error(`❌ Erreur commande ${interaction.commandName}:`, {
      error: error.message,
      stack: error.stack,
      user: interaction.user.tag,
      guild: interaction.guild?.name,
      channel: interaction.channel?.name,
    });
  }
}

// Gestionnaire de sélections avec validation
async function handleSelectMenu(interaction) {
  if (interaction.customId === "select_playlist") {
    logger.info(`Sélection de playlist par ${interaction.user.tag}`);

    try {
      await handlePlaylistSelect(interaction);
      logger.success(
        `Playlist sélectionnée avec succès par ${interaction.user.tag}`
      );
    } catch (error) {
      await monitor.handleCommandError(error, interaction);
      logger.error("Erreur dans handlePlaylistSelect:", error);
    }
  } else {
    logger.warn(`Sélection non reconnue: ${interaction.customId}`);
  }
}

// Gestionnaire de boutons
async function handleButton(interaction) {
  const customId = interaction.customId;

  if (customId.startsWith("play_")) {
    const playlist = customId.replace("play_", "");
    logger.info(
      `Bouton play activé pour ${playlist} par ${interaction.user.tag}`
    );

    try {
      await interaction.reply({
        content: `▶️ Lancement de la playlist: **${playlist}**`,
        flags: MessageFlags.Ephemeral,
      });
      // Ici vous pouvez ajouter la logique de lancement de playlist
    } catch (error) {
      await monitor.handleCommandError(error, interaction);
    }
  } else if (customId.startsWith("stop_")) {
    const playlist = customId.replace("stop_", "");
    logger.info(
      `Bouton stop activé pour ${playlist} par ${interaction.user.tag}`
    );

    try {
      await interaction.reply({
        content: `⏹️ Arrêt de la playlist: **${playlist}**`,
        flags: MessageFlags.Ephemeral,
      });
      // Ici vous pouvez ajouter la logique d'arrêt de playlist
    } catch (error) {
      await monitor.handleCommandError(error, interaction);
    }
  } else if (customId.startsWith("info_")) {
    const playlist = customId.replace("info_", "");
    logger.info(
      `Bouton info activé pour ${playlist} par ${interaction.user.tag}`
    );

    try {
      await interaction.reply({
        content: `ℹ️ Informations sur la playlist: **${playlist}**`,
        flags: MessageFlags.Ephemeral,
      });
      // Ici vous pouvez ajouter la logique d'affichage d'informations
    } catch (error) {
      await monitor.handleCommandError(error, interaction);
    }
  } else {
    logger.warn(`Bouton non reconnu: ${customId}`);
    await interaction.reply({
      content: "❌ Action non reconnue.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Gestionnaire principal d'interactions
export default {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      // Validation de base
      if (!isValidInteraction(interaction)) {
        logger.error("Interaction invalide reçue:", interaction);
        return;
      }

      // Log de l'interaction
      logger.event(
        `Interaction reçue: ${interaction.type} par ${
          interaction.user?.tag || "unknown"
        }`
      );

      // Gestion selon le type d'interaction
      switch (interaction.type) {
        case InteractionType.ApplicationCommand:
          await handleCommand(interaction);
          break;

        case InteractionType.MessageComponent:
          if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
          } else if (interaction.isButton()) {
            await handleButton(interaction);
          } else {
            logger.warn(
              `Type de composant non géré: ${interaction.componentType}`
            );
          }
          break;

        default:
          logger.warn(`Type d'interaction non géré: ${interaction.type}`);
      }
    } catch (error) {
      // Gestion d'erreur globale
      monitor.handleCriticalError(error, "INTERACTION_CREATE");

      logger.error("Erreur critique dans interactionCreate:", {
        error: error.message,
        stack: error.stack,
        interactionType: interaction?.type,
        user: interaction?.user?.tag,
        guild: interaction?.guild?.name,
      });

      // Tentative de réponse à l'utilisateur
      try {
        if (interaction && !interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              "❌ Une erreur inattendue s'est produite. Veuillez réessayer.",
            flags: MessageFlags.Ephemeral,
          });
        } else if (
          interaction &&
          (interaction.replied || interaction.deferred)
        ) {
          await interaction.editReply({
            content:
              "❌ Une erreur inattendue s'est produite. Veuillez réessayer.",
          });
        }
      } catch (replyError) {
        logger.error("Impossible de répondre à l'utilisateur:", replyError);
      }
    }
  },
};

