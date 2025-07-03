import logger from "./logger.js";

/**
 * Envoie un message dans le canal #social.
 * @param {Client} client - Le client Discord.
 * @param {string} message - Le message à envoyer.
 */
export async function postToSocialChannel(client, message) {
  const channelId = process.env.DISCORD_SOCIAL_CHANNEL_ID;

  if (!channelId) {
    logger.logError("DISCORD_SOCIAL_CHANNEL_ID manquant dans .env");
    return;
  }

  try {
    logger.logInfo("Tentative d'envoi de message dans #social");

    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      logger.logWarn("Canal introuvable", { channelId });
      return;
    }

    const sentMessage = await channel.send(message);

    logger.logInfo("Message posté dans #social", {
      messageId: sentMessage.id,
      content: sentMessage.content,
      channel: channel.name,
    });

    return sentMessage;
  } catch (error) {
    logger.logError("Erreur lors de l'envoi dans #social", {
      error: error.message,
      stack: error.stack,
    });
  }
}

