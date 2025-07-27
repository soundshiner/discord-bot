// ========================================
// bot/commands/pro/backlog.js - Version refactor centralisée
// ========================================

import { SlashCommandBuilder } from '@discordjs/builders';
import Airtable from 'airtable';
import logger from '../../../bot/logger.js';
import config from '../../../bot/config.js';

let base = null;
if (config.AIRTABLE_API_KEY && config.AIRTABLE_BASE_ID) {
  try {
    base = new Airtable({ apiKey: config.AIRTABLE_API_KEY }).base(config.AIRTABLE_BASE_ID);
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation d\'Airtable:', error);
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('backlog')
    .setDescription('Ajouter une idée au backlog')
    .addStringOption(option =>
      option.setName('idee_de_campagne')
        .setDescription('Décrivez votre idée de campagne (plusieurs posts sur un même sujet)')
        .setRequired(true)
        .setMaxLength(500)),

  async execute (interaction) {
    if (!base) {
      logger.error('Airtable mal configuré');
      return {
        success: false,
        message: '❌ Service temporairement indisponible. Contactez un admin.',
        ephemeral: true
      };
    }

    const ideeText = interaction.options.getString('idee');
    const { user } = interaction;

    if (!ideeText || ideeText.trim().length === 0) {
      return {
        success: false,
        message: '❌ Votre idée ne peut pas être vide.',
        ephemeral: true
      };
    }

    try {
      logger.info(`Ajout d'une idée au backlog par ${user.tag}`, {
        userId: user.id,
        ideaLength: ideeText.length
      });

      const createdRecord = await base('📣 Campagnes').create([{
        fields: {
          'Nom de la campagne': ideeText.trim(),
          'Utilisateur': user.tag,
          'User ID': user.id,
          'Date': new Date().toISOString(),
          'Statut': '💡 Backlog'
        }
      }]);

      const recordId = createdRecord[0].id;
      const airtableUrl = `https://airtable.com/${config.AIRTABLE_BASE_ID}/tbl82ZbV0eXAHy4Ct/${recordId}`;

      const embed = {
        color: 0x00ff00,
        title: '✅ Idée ajoutée au backlog !',
        description: `**Votre idée :** ${ideeText}`,
        fields: [
          {
            name: '🔗 Lien Airtable',
            value: `[Voir dans Airtable](${airtableUrl})`,
            inline: false
          },
          {
            name: '👤 Ajoutée par',
            value: user.tag,
            inline: true
          },
          {
            name: '📅 Date',
            value: new Date().toLocaleDateString('fr-FR'),
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Merci pour votre contribution !'
        }
      };

      return {
        success: true,
        embeds: [embed],
        ephemeral: false
      };
    } catch (error) {
      logger.error('Erreur lors de l\'ajout au backlog Airtable:', {
        error: error.message,
        userId: user.id,
        ideaLength: ideeText.length
      });

      let errorMessage = '❌ Oups, il y a eu un problème en ajoutant votre idée.';
      if (error.message.includes('AUTHENTICATION_REQUIRED')) {
        errorMessage = '❌ Erreur d\'authentification Airtable.';
      } else if (error.message.includes('NOT_FOUND')) {
        errorMessage = '❌ Base Airtable introuvable.';
      } else if (error.message.includes('REQUEST_TOO_LARGE')) {
        errorMessage = '❌ Votre idée est trop longue.';
      }

      return {
        success: false,
        message: errorMessage,
        ephemeral: true
      };
    }
  }
};
