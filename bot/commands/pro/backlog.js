// bot/commands/pro/backlog.js
import { SlashCommandBuilder } from '@discordjs/builders';
import Airtable from 'airtable';
import logger from '../../../utils/logger.js'; // Assurez-vous que le chemin est correct
import config from '../../../config.js'; // Assurez-vous que le chemin est correct
const base = new Airtable({ apiKey: config.AIRTABLE_API_KEY }).base(config.AIRTABLE_BASE_ID);

export default {
  data: new SlashCommandBuilder()
    .setName('backlog')
    .setDescription('Ajouter une idée au backlog')
    .addStringOption(option =>
      option.setName('idee')
        .setDescription('Votre idée géniale')
        .setRequired(true)),

  async execute (interaction) {
    const ideeText = interaction.options.getString('idee');
    try {
      const createdRecord = await base('Backlog').create([{ fields: { 'Idée': ideeText,
        'Utilisateur':
                            interaction.user.tag } }]);
      const recordId = createdRecord[0].id;
      const airtableUrl = `https://airtable.com/${config.AIRTABLE_BASE_ID}/tblXXXXXXXX/${recordId}`;
      await interaction.reply(`✅ Votre idée a été ajoutée ! Consultez-la ici : ${airtableUrl}`);
    } catch (error) {
      logger.error('Erreur Airtable:', error);
      await interaction.reply('❌ Oups, il y a eu un problème en ajoutant votre idée.');
    }
  }
};