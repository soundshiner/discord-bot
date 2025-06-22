// events/messageCreate.js
import logger from "../utils/logger.js";

export default {
  name: "messageCreate",

  async execute(message) {
    // Ignorer les messages invalides, de bots ou sans auteur
    if (!message || !message.author || message.author.bot) return;

    // Ignorer les messages trop vieux (plus de 30 secondes)
    const MAX_MESSAGE_AGE_MS = 30 * 1000;
    const messageAge = Date.now() - message.createdTimestamp;
    if (messageAge > MAX_MESSAGE_AGE_MS) {
      logger.warn(
        `Message ignoré car trop vieux (${messageAge} ms): "${message.content}" de ${message.author.tag}`
      );
      return;
    }

    // Vérifie le préfixe
    const prefix = message.client.config.PREFIX;
    if (!message.content.startsWith(prefix)) return;

    // Ignorer les réponses aux messages du bot
    if (message.reference?.messageId) {
      try {
        const repliedMessage = await message.channel.messages.fetch(
          message.reference.messageId
        );
        if (repliedMessage.author.id === message.client.user.id) {
          logger.warn(
            `Message ignoré car c'est une réponse au bot: "${message.content}" de ${message.author.tag}`
          );
          return;
        }
      } catch (err) {
        // Pas de panique si le fetch échoue, on laisse passer
      }
    }

    logger.infocmd(
      `${message.author.tag} → "${message.content}" (${messageAge} ms)`
    );

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.commands.get(commandName);
    if (!command) {
      logger.warn(`Commande inconnue: ${commandName}`);
      return;
    }

    try {
      await command.execute(message, args, message.client, logger);
      logger.success(
        `Commande exécutée: ${commandName} par ${message.author.tag}`
      );
    } catch (error) {
      logger.error(
        `Erreur dans la commande '${commandName}': ${error.message}`
      );
      message.reply(
        "Il y a eu une erreur lors de l'exécution de cette commande."
      );
    }
  },
};
