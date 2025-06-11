import { getVoiceConnection } from "@discordjs/voice";
import config from "../core/config.js";
import logger from "../utils/logger.js";

const { ADMIN_ROLE_ID } = config;

export default {
  name: "stop",
  description: "Arrête le stream et déconnecte le bot du salon vocal",
  async execute(message) {
    try {
      if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return message.reply(
          "❌ Cette commande est réservée aux administrateurs."
        );
      }

      const connection = getVoiceConnection(message.guild.id);
      if (!connection) {
        return message.reply("❌ Le bot n'est pas connecté à un salon vocal.");
      }

      connection.destroy();
      logger.success(
        `Bot déconnecté du salon vocal sur le serveur ${message.guild.name}`
      );
      return message.reply(
        "🛑 Le stream a été arrêté et le bot a quitté le salon vocal."
      );
    } catch (error) {
      logger.error(`Erreur dans la commande stop: ${error.message}`);
      return message.reply(
        "❌ Une erreur est survenue lors de l'arrêt du stream."
      );
    }
  },
};
