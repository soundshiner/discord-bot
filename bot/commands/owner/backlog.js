// bot/commands/pro/backlog.js
import { SlashCommandBuilder } from '@discordjs/builders';
import Airtable from 'airtable';
import logger from '../../logger.js';
import config from '../../config.js';

// Configure Airtable globalement avec ton token PAT
Airtable.configure({ apiKey: config.AIRTABLE_API_KEY });

const base = Airtable.base(config.AIRTABLE_BASE_ID);

export default {
  data: new SlashCommandBuilder()
    .setName('backlog')
    .setDescription('Ajouter une idée au backlog')
    .addStringOption(option =>
      option.setName('idee')
        .setDescription('Votre idée géniale')
        .setRequired(true)),

  async execute(interaction) {
    const ideeText = interaction.options.getString('idee');
    try {
      const createdRecord = await base('Backlog').create([
        {
          fields: {
            'Idée': ideeText,
            'Utilisateur': interaction.user.tag
          }
        }
      ]);
      const recordId = createdRecord.id;
      const airtableUrl = `https://airtable.com/${config.AIRTABLE_BASE_ID}/tbl596FG8SCA1C2Pq/${recordId}`;
      await interaction.reply(`✅ Votre idée a été ajoutée ! Consultez-la ici : ${airtableUrl}`);
    } catch (error) {
      logger.error('Erreur Airtable:', error);
      await interaction.reply('❌ Oups, il y a eu un problème en ajoutant votre idée.');
    }
  }
};
