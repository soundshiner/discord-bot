import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import getSilenceDetector from '../../../core/services/SilenceDetector.js';
import logger from '../../logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('silence')
    .setDescription('Gérer le détecteur de silence')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('start')
        .setDescription('Démarrer la surveillance du silence'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('stop')
        .setDescription('Arrêter la surveillance du silence'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('status')
        .setDescription('Voir le statut du détecteur de silence'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('config')
        .setDescription('Configurer le détecteur de silence')
        .addIntegerOption((option) =>
          option
            .setName('threshold')
            .setDescription('Seuil de silence en secondes (défaut: 5)')
            .setMinValue(1)
            .setMaxValue(300))
        .addIntegerOption((option) =>
          option
            .setName('interval')
            .setDescription(
              'Intervalle de vérification en secondes (défaut: 10)'
            )
            .setMinValue(5)
            .setMaxValue(60)))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add-alert')
        .setDescription('Ajouter un destinataire d\'alerte')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('Utilisateur à ajouter')
            .setRequired(true)))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove-alert')
        .setDescription('Supprimer un destinataire d\'alerte')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('Utilisateur à supprimer')
            .setRequired(true)))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('test')
        .setDescription('Tester le détecteur de silence')),

  async execute (interaction) {
    try {
      const silenceDetector = getSilenceDetector();
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
      case 'start':
        await this.handleStart(interaction, silenceDetector);
        break;
      case 'stop':
        await this.handleStop(interaction, silenceDetector);
        break;
      case 'status':
        await this.handleStatus(interaction, silenceDetector);
        break;
      case 'config':
        await this.handleConfig(interaction, silenceDetector);
        break;
      case 'add-alert':
        await this.handleAddAlert(interaction, silenceDetector);
        break;
      case 'remove-alert':
        await this.handleRemoveAlert(interaction, silenceDetector);
        break;
      case 'test':
        await this.handleTest(interaction, silenceDetector);
        break;
      default:
        await interaction.reply({
          content: '❌ Sous-commande non reconnue',
          ephemeral: true
        });
      }
    } catch (error) {
      logger.error('Erreur dans la commande silence:', error);
      await interaction.reply({
        content:
          '❌ Une erreur est survenue lors de l\'exécution de la commande',
        ephemeral: true
      });
    }
  },

  async handleStart (interaction, silenceDetector) {
    silenceDetector.startMonitoring();

    const status = silenceDetector.getStatus();
    const embed = {
      color: 0x00ff00,
      title: '🔇 Surveillance du silence démarrée',
      description: 'Le détecteur de silence est maintenant actif.',
      fields: [
        {
          name: 'Seuil de silence',
          value: `${status.silenceThreshold / 1000}s`,
          inline: true
        },
        {
          name: 'Intervalle de vérification',
          value: `${status.checkInterval / 1000}s`,
          inline: true
        },
        {
          name: 'Alertes activées',
          value: status.config.enableAlerts ? '✅ Oui' : '❌ Non',
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  },

  async handleStop (interaction, silenceDetector) {
    silenceDetector.stopMonitoring();

    const embed = {
      color: 0xff0000,
      title: '🔇 Surveillance du silence arrêtée',
      description: 'Le détecteur de silence a été désactivé.',
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  },

  async handleStatus (interaction, silenceDetector) {
    const status = silenceDetector.getStatus();
    const lastActivity = status.lastAudioActivity
      ? new Date(status.lastAudioActivity).toLocaleString('fr-FR')
      : 'Jamais';

    const silenceStart = status.silenceStartTime
      ? new Date(status.silenceStartTime).toLocaleString('fr-FR')
      : 'Aucun';

    const embed = {
      color: status.isMonitoring ? 0x00ff00 : 0xff0000,
      title: '🔇 Statut du détecteur de silence',
      fields: [
        {
          name: 'État',
          value: status.isMonitoring ? '🟢 Actif' : '🔴 Inactif',
          inline: true
        },
        {
          name: 'Seuil de silence',
          value: `${status.silenceThreshold / 1000}s`,
          inline: true
        },
        {
          name: 'Intervalle de vérification',
          value: `${status.checkInterval / 1000}s`,
          inline: true
        },
        {
          name: 'Dernière activité audio',
          value: lastActivity,
          inline: true
        },
        {
          name: 'Début du silence',
          value: silenceStart,
          inline: true
        },
        {
          name: 'Alerte envoyée',
          value: status.alertSent ? '✅ Oui' : '❌ Non',
          inline: true
        },
        {
          name: 'Destinataires d\'alerte',
          value:
            status.alertRecipients.length > 0
              ? status.alertRecipients.join(', ')
              : 'Aucun',
          inline: false
        },
        {
          name: 'Configuration',
          value:
            `Alertes: ${
              status.config.enableAlerts ? 'Activées' : 'Désactivées'
            }\n`
            + `Canal d'alerte: ${
              status.config.alertChannelId || 'Non configuré'
            }\n`
            + `Admin: ${status.config.adminUserId || 'Non configuré'}`,
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  },

  async handleConfig (interaction, silenceDetector) {
    const threshold = interaction.options.getInteger('threshold');
    const interval = interaction.options.getInteger('interval');

    if (threshold) {
      silenceDetector.updateConfig({ silenceThreshold: threshold * 1000 });
    }

    if (interval) {
      silenceDetector.updateConfig({ checkInterval: interval * 1000 });
    }

    const status = silenceDetector.getStatus();
    const embed = {
      color: 0x0099ff,
      title: '⚙️ Configuration mise à jour',
      description:
        'La configuration du détecteur de silence a été mise à jour.',
      fields: [
        {
          name: 'Seuil de silence',
          value: `${status.silenceThreshold / 1000}s`,
          inline: true
        },
        {
          name: 'Intervalle de vérification',
          value: `${status.checkInterval / 1000}s`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  },

  async handleAddAlert (interaction, silenceDetector) {
    const user = interaction.options.getUser('user');

    silenceDetector.addAlertRecipient(user.id);

    const embed = {
      color: 0x00ff00,
      title: 'Destinataire ajouté',
      description: `${user.tag} a été ajouté aux destinataires d'alerte.`,
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  },

  async handleRemoveAlert (interaction, silenceDetector) {
    const user = interaction.options.getUser('user');

    silenceDetector.removeAlertRecipient(user.id);

    const embed = {
      color: 0xff0000,
      title: '❌ Destinataire supprimé',
      description: `${user.tag} a été supprimé des destinataires d'alerte.`,
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  },

  async handleTest (interaction, silenceDetector) {
    const status = silenceDetector.getStatus();

    if (!status.isMonitoring) {
      await interaction.reply({
        content:
          '❌ Le détecteur de silence n\'est pas actif. Utilisez `/silence start` pour le démarrer.',
        ephemeral: true
      });
      return;
    }

    // Simuler une alerte de test
    const testMessage
      = '🧪 **TEST D\'ALERTE**\n\n'
      + 'Ceci est un test du système d\'alerte de silence.\n'
      + `⏰ Test effectué à: ${new Date().toLocaleString('fr-FR')}\n`
      + 'Le système fonctionne correctement.';

    try {
      const client = await silenceDetector.getDiscordClient();
      if (client) {
        await silenceDetector.sendDirectMessage(client, testMessage);

        const embed = {
          color: 0x00ff00,
          title: '🧪 Test d\'alerte envoyé',
          description:
            'L\'alerte de test a été envoyée aux destinataires configurés.',
          timestamp: new Date().toISOString()
        };

        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({
          content:
            '❌ Impossible d\'envoyer le test - Client Discord non disponible',
          ephemeral: true
        });
      }
    } catch (error) {
      logger.error('Erreur lors du test d\'alerte:', error);
      await interaction.reply({
        content: '❌ Erreur lors de l\'envoi du test d\'alerte',
        ephemeral: true
      });
    }
  }
};
