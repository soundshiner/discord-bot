// ========================================
// bot/events/interactionCreate.js - Gestionnaire d'interactions optimisé
// ========================================

import {
  InteractionType,
  ApplicationCommandType,
  ComponentType,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} from "discord.js";
import logger from "../logger.js";
import monitor from "../../core/monitor.js";
import appState from "../../core/services/AppState.js";
import { retryDiscord } from "../../core/utils/retry.js";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    try {
      // Mettre à jour les métriques
      appState.incrementCommandsExecuted();

      // Validation de base
      if (!interaction || !interaction.isChatInputCommand()) {
        return;
      }

      // Log de l'interaction
      logger.info(
        `Commande exécutée: ${interaction.commandName} par ${
          interaction.user.tag
        } (${interaction.user.id}) dans ${interaction.guild?.name || "DM"}`
      );

      // Gestion des commandes avec retry
      await retryDiscord(
        async () => {
          await handleCommand(interaction);
        },
        {
          onRetry: (error, attempt) => {
            logger.warn(`Tentative de commande ${attempt}: ${error.message}`);
          },
        }
      );
    } catch (error) {
      // Gestion d'erreur centralisée
      await monitor.handleCommandError(error, interaction);
    }
  },
};

/**
 * Gère les commandes slash avec validation et monitoring
 */
async function handleCommand(interaction) {
  const { commandName } = interaction;

  // Validation des permissions
  if (!(await validatePermissions(interaction))) {
    return;
  }

  // Validation du contexte
  if (!(await validateContext(interaction))) {
    return;
  }

  // Exécution de la commande
  switch (commandName) {
    case "suggestion":
      await handleSuggestionCommand(interaction);
      break;
    case "dj":
      await handleDjCommand(interaction);
      break;
    case "ping":
      await handlePingCommand(interaction);
      break;
    case "help":
      await handleHelpCommand(interaction);
      break;
    default:
      await handleUnknownCommand(interaction);
  }
}

/**
 * Valide les permissions de l'utilisateur
 */
async function validatePermissions(interaction) {
  const { user, guild } = interaction;

  // Vérifications de base
  if (!user) {
    await interaction.reply({
      content: "❌ Impossible de récupérer les informations utilisateur",
      ephemeral: true,
    });
    return false;
  }

  // Vérifications spécifiques par commande
  const commandName = interaction.commandName;

  if (commandName === "dj" && guild) {
    const member = await guild.members.fetch(user.id);
    if (!member.permissions.has("ManageGuild")) {
      await interaction.reply({
        content:
          "🔒 Vous devez avoir la permission 'Gérer le serveur' pour utiliser cette commande",
        ephemeral: true,
      });
      return false;
    }
  }

  return true;
}

/**
 * Valide le contexte de l'interaction
 */
async function validateContext(interaction) {
  const { guild, channel } = interaction;

  // Vérifications de contexte
  if (interaction.commandName === "suggestion" && !guild) {
    await interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans un serveur",
      ephemeral: true,
    });
    return false;
  }

  if (interaction.commandName === "dj" && !guild) {
    await interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans un serveur",
      ephemeral: true,
    });
    return false;
  }

  return true;
}

/**
 * Gère la commande /suggestion
 */
async function handleSuggestionCommand(interaction) {
  const suggestion = interaction.options.getString("suggestion");
  const user = interaction.user;

  if (!suggestion || suggestion.trim().length < 3) {
    await interaction.reply({
      content: "❌ La suggestion doit contenir au moins 3 caractères",
      ephemeral: true,
    });
    return;
  }

  if (suggestion.length > 1000) {
    await interaction.reply({
      content: "❌ La suggestion ne peut pas dépasser 1000 caractères",
      ephemeral: true,
    });
    return;
  }

  try {
    // Sauvegarder en base de données
    const db = await import("../utils/database.js");
    await db.default.addSuggestion(user.id, user.username, suggestion.trim());

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("💡 Nouvelle suggestion")
      .setDescription(suggestion.trim())
      .addFields(
        { name: "Auteur", value: user.tag, inline: true },
        { name: "Serveur", value: interaction.guild.name, inline: true },
        {
          name: "Date",
          value: new Date().toLocaleString("fr-FR"),
          inline: true,
        }
      )
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp();

    // Boutons d'action
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`suggestion_approve_${user.id}`)
        .setLabel("✅ Approuver")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`suggestion_reject_${user.id}`)
        .setLabel("❌ Rejeter")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`suggestion_implement_${user.id}`)
        .setLabel("🚀 Implémenter")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    logger.info(
      `Suggestion créée par ${user.tag}: ${suggestion.substring(0, 50)}...`
    );
  } catch (error) {
    logger.error("Erreur lors de la création de la suggestion:", error);
    await interaction.reply({
      content: "❌ Erreur lors de la sauvegarde de la suggestion",
      ephemeral: true,
    });
  }
}

/**
 * Gère la commande /dj
 */
async function handleDjCommand(interaction) {
  const action = interaction.options.getString("action");
  const targetUser = interaction.options.getUser("utilisateur");
  const user = interaction.user;

  try {
    const db = await import("../utils/database.js");

    switch (action) {
      case "add":
        await db.default.setDjStatus(targetUser.id, targetUser.username, true);
        await interaction.reply({
          content: `✅ ${targetUser.tag} est maintenant DJ`,
          ephemeral: true,
        });
        logger.info(`DJ ajouté par ${user.tag}: ${targetUser.tag}`);
        break;

      case "remove":
        await db.default.setDjStatus(targetUser.id, targetUser.username, false);
        await interaction.reply({
          content: `❌ ${targetUser.tag} n'est plus DJ`,
          ephemeral: true,
        });
        logger.info(`DJ retiré par ${user.tag}: ${targetUser.tag}`);
        break;

      case "list":
        const djList = await db.default.getAllDjStatus();
        const activeDj = djList.filter((dj) => dj.is_dj === 1);

        if (activeDj.length === 0) {
          await interaction.reply({
            content: "📋 Aucun DJ actif",
            ephemeral: true,
          });
        } else {
          const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("🎵 DJs actifs")
            .setDescription(activeDj.map((dj) => `• ${dj.username}`).join("\n"))
            .setTimestamp();

          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }
        break;

      default:
        await interaction.reply({
          content: "❌ Action invalide",
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error("Erreur lors de la gestion DJ:", error);
    await interaction.reply({
      content: "❌ Erreur lors de la gestion des DJs",
      ephemeral: true,
    });
  }
}

/**
 * Gère la commande /ping
 */
async function handlePingCommand(interaction) {
  const botState = appState.getBotState();
  const dbState = appState.getDatabaseState();

  const embed = new EmbedBuilder()
    .setColor("#00ff00")
    .setTitle("🏓 Pong!")
    .addFields(
      {
        name: "Latence Bot",
        value: `${Date.now() - interaction.createdTimestamp}ms`,
        inline: true,
      },
      { name: "Uptime", value: formatUptime(botState.uptime), inline: true },
      {
        name: "Base de données",
        value: dbState.isHealthy ? "✅ Connectée" : "❌ Déconnectée",
        inline: true,
      },
      {
        name: "Mémoire",
        value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        inline: true,
      },
      {
        name: "Commandes exécutées",
        value: botState.commandsExecuted.toString(),
        inline: true,
      },
      {
        name: "Commandes échouées",
        value: botState.commandsFailed.toString(),
        inline: true,
      }
    )
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

/**
 * Gère la commande /help
 */
async function handleHelpCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("🤖 soundSHINE Bot - Aide")
    .setDescription("Voici les commandes disponibles:")
    .addFields(
      {
        name: "💡 /suggestion",
        value: "Proposer une amélioration pour le bot",
        inline: false,
      },
      {
        name: "🎵 /dj",
        value: "Gérer les DJs du serveur (ajouter/retirer/liste)",
        inline: false,
      },
      {
        name: "🏓 /ping",
        value: "Vérifier l'état du bot et les métriques",
        inline: false,
      },
      {
        name: "❓ /help",
        value: "Afficher cette aide",
        inline: false,
      }
    )
    .setFooter({ text: "soundSHINE Bot v2.0" })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

/**
 * Gère les commandes inconnues
 */
async function handleUnknownCommand(interaction) {
  await interaction.reply({
    content:
      "❓ Commande inconnue. Utilisez `/help` pour voir les commandes disponibles",
    ephemeral: true,
  });
}

/**
 * Formate l'uptime en format lisible
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

