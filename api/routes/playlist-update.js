import express from "express";
import botConfig from "../../bot/config.js";
import { z } from "zod";

const { VOICE_CHANNEL_ID, API_TOKEN, PLAYLIST_CHANNEL_ID } = botConfig;

const playlistSchema = z.object({
  playlist: z.string().min(1, "Playlist is required"),
  topic: z.string().min(1, "Topic is required"),
});

// Fonction pour essayer de récupérer les caractères corrompus
const tryFixEncoding = (text) => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Si le texte contient des caractères de remplacement, essayer de le récupérer
  if (text.includes("")) {
    console.log("🔧 Tentative de récupération d'encodage pour:", text);

    // Essayer différents encodages
    const encodings = ["latin1", "iso-8859-1", "cp1252", "utf8"];

    for (const encoding of encodings) {
      try {
        // Convertir en buffer puis en string avec l'encodage
        const buffer = Buffer.from(text, "binary");
        const decoded = buffer.toString(encoding);

        if (!decoded.includes("")) {
          console.log(`✅ Récupération réussie avec ${encoding}:`, decoded);
          return decoded;
        }
      } catch (e) {
        console.log(`❌ Échec avec ${encoding}:`, e.message);
      }
    }
  }

  return text;
};

// Fonction pour décoder les séquences d'échappement Unicode
const decodeUnicodeEscapes = (text) => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Décoder les séquences \uXXXX
  let decoded = text.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Décoder les caractères spéciaux courants encodés par PowerShell
  const specialChars = {
    "\\u0027": "'", // Apostrophe
    "\\u0022": '"', // Guillemet double
    "\\u003c": "<", // Chevron gauche
    "\\u003e": ">", // Chevron droit
    "\\u0026": "&", // Et commercial
    "\\u003d": "=", // Égal
    "\\u002b": "+", // Plus
    "\\u002d": "-", // Moins
    "\\u0028": "(", // Parenthèse ouvrante
    "\\u0029": ")", // Parenthèse fermante
    "\\u005b": "[", // Crochet ouvrant
    "\\u005d": "]", // Crochet fermant
    "\\u007b": "{", // Accolade ouvrante
    "\\u007d": "}", // Accolade fermante
    "\\u005c": "\\", // Backslash
    "\\u002f": "/", // Slash
    "\\u003a": ":", // Deux points
    "\\u003b": ";", // Point-virgule
    "\\u002c": ",", // Virgule
    "\\u002e": ".", // Point
    "\\u0021": "!", // Point d'exclamation
    "\\u003f": "?", // Point d'interrogation
  };

  // Remplacer les séquences spéciales
  for (const [encoded, replacement] of Object.entries(specialChars)) {
    decoded = decoded.replace(
      new RegExp(encoded.replace(/\\/g, "\\\\"), "g"),
      replacement
    );
  }

  return decoded;
};

// Fonction pour s'assurer que les accents sont correctement encodés
const ensureAccentEncoding = (text) => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // D'abord décoder les séquences d'échappement Unicode
  let cleanedText = decodeUnicodeEscapes(text);

  // Ensuite essayer de récupérer les caractères corrompus
  cleanedText = tryFixEncoding(cleanedText);

  // Détecter et corriger les caractères corrompus ()
  // Remplacer les caractères de remplacement Unicode (U+FFFD) par des espaces
  cleanedText = cleanedText.replace(/\uFFFD/g, " ");

  // Essayer de récupérer les caractères UTF-8 mal encodés
  try {
    // Si le texte contient des séquences d'échappement Unicode, les décoder
    if (cleanedText.includes("\\u")) {
      cleanedText = JSON.parse(`"${cleanedText}"`);
    }
  } catch (e) {
    // Si ça échoue, on garde le texte tel quel
  }

  // S'assurer que le texte est correctement encodé en UTF-8
  // et normalisé pour éviter les problèmes avec Discord
  return cleanedText
    .normalize("NFC") // Normalisation Unicode pour s'assurer que les accents sont bien formés
    .trim(); // Supprimer les espaces en début/fin
};

// Fonction de débogage pour vérifier l'encodage
const debugEncoding = (text, label) => {
  if (!text) return;

  console.log(`=== DEBUG ENCODING: ${label} ===`);
  console.log(`Original: "${text}"`);
  console.log(`Length: ${text.length}`);
  console.log(
    `Char codes: ${Array.from(text)
      .map((c) => c.charCodeAt(0))
      .join(", ")}`
  );
  console.log(`UTF-8 bytes: ${Buffer.from(text, "utf8").toString("hex")}`);
  console.log(`Normalized: "${ensureAccentEncoding(text)}"`);
  console.log("================================");
};

export default (client, logger) => {
  const router = express.Router();

  // Configuration pour s'assurer que les données JSON sont correctement décodées
  router.use(
    express.json({
      limit: "10mb",
      verify: (req, res, buf) => {
        // S'assurer que le buffer est traité comme UTF-8
        req.rawBody = buf;
      },
    })
  );

  router.post("/", async (req, res) => {
    try {
      logger.info("POST /v1/send-playlist");

      // Debug du raw body pour diagnostiquer l'encodage
      if (req.rawBody) {
        logger.info("🔍 DEBUG RAW BODY:");
        logger.info(`Raw body hex: ${req.rawBody.toString("hex")}`);
        logger.info(`Raw body utf8: ${req.rawBody.toString("utf8")}`);
        logger.info(`Raw body length: ${req.rawBody.length}`);
      }

      // Vérification du token dans le header
      const apiKey = req.headers["x-api-key"];
      if (!apiKey || apiKey !== API_TOKEN) {
        return res.status(403).json({ error: "Invalid or missing API token." });
      }

      // Validation du body avec zod
      const parseResult = playlistSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: parseResult.error.errors,
        });
      }
      const { playlist, topic } = parseResult.data;

      // Normalisation des textes pour gérer les accents
      const normalizedPlaylist = ensureAccentEncoding(playlist);
      const normalizedTopic = ensureAccentEncoding(topic);

      // Debug de l'encodage
      debugEncoding(playlist, "PLAYLIST ORIGINAL");
      debugEncoding(normalizedPlaylist, "PLAYLIST NORMALISÉ");
      debugEncoding(topic, "TOPIC ORIGINAL");
      debugEncoding(normalizedTopic, "TOPIC NORMALISÉ");

      // Debug spécifique pour les séquences Unicode
      console.log("🔍 DEBUG SÉQUENCES UNICODE:");
      console.log(`Playlist original: "${playlist}"`);
      console.log(
        `Playlist après décodage Unicode: "${decodeUnicodeEscapes(playlist)}"`
      );
      console.log(`Topic original: "${topic}"`);
      console.log(
        `Topic après décodage Unicode: "${decodeUnicodeEscapes(topic)}"`
      );

      logger.info(`Topic original: ${topic}`);
      logger.info(`Topic normalisé: ${normalizedTopic}`);
      logger.info(`Playlist original: ${playlist}`);
      logger.info(`Playlist normalisé: ${normalizedPlaylist}`);

      let playlistSent = false;
      let stageTopic = false;

      logger.info("=== DÉBUT DU TRAITEMENT ===");

      // 1. Envoi de l'embed de playlist
      logger.info("🔄 Étape 1: Récupération du canal playlist...");
      const playlistChannel = client.channels.cache.get(PLAYLIST_CHANNEL_ID);

      if (!playlistChannel?.isTextBased()) {
        logger.error("❌ Canal playlist introuvable ou invalide");
        return res
          .status(500)
          .json({ error: "Canal Discord invalide pour la playlist." });
      }

      logger.info(`✅ Canal playlist trouvé: ${playlistChannel.name}`);

      const description = `**${normalizedPlaylist}** est maintenant en cours sur soundSHINE! 
      \nVous pouvez l'écouter en direct sur le canal <#1383684854255849613>.`;

      const embed = {
        title: "💿 Nouvelle Session en cours",
        description,
        color: 0xaff6e4,
        footer: {
          text: "https://soundshineradio.com",
          icon_url: "https://soundshineradio.com/avatar.jpg",
        },
      };

      // Vérification finale de l'encodage avant envoi
      logger.info("🔍 Vérification finale de l'encodage:");
      logger.info(`Description embed: "${description}"`);
      logger.info(
        `Description bytes: ${Buffer.from(description, "utf8").toString("hex")}`
      );

      logger.info("🔄 Étape 2: Tentative d'envoi de l'embed...");
      try {
        await playlistChannel.send({ embeds: [embed] });
        logger.info("✅ Embed playlist envoyé avec succès");
        playlistSent = true;
      } catch (embedErr) {
        logger.error(
          `❌ Erreur lors de l'envoi de l'embed: ${embedErr.message}`
        );
        logger.error(`Code d'erreur embed: ${embedErr.code}`);
        // Continue quand même pour tester le stage channel
      }

      // 2. Mise à jour du stage channel
      logger.info("🔄 Étape 3: Récupération du stage channel...");
      try {
        const stageChannel = await client.channels.fetch(VOICE_CHANNEL_ID);

        if (!stageChannel || stageChannel.type !== 13) {
          logger.error(
            `❌ Stage channel invalide. Type: ${stageChannel?.type}, ID: ${VOICE_CHANNEL_ID}`
          );
          throw new Error("Canal Stage invalide");
        }

        logger.info(`✅ Stage channel trouvé: ${stageChannel.name}`);

        logger.info("🔄 Étape 4: Vérification de l'instance de stage...");
        const { stageInstance } = stageChannel;

        if (!stageInstance) {
          logger.info(
            "🔄 Étape 5a: Aucune instance active, création en cours..."
          );
          try {
            await stageChannel.createStageInstance({ topic: normalizedTopic });
            logger.info(
              `✅ Instance de stage créée avec sujet: ${normalizedTopic}`
            );
            stageTopic = true;
          } catch (createErr) {
            logger.error(`❌ Erreur lors de la création: ${createErr.message}`);
            logger.error(`Code d'erreur création: ${createErr.code}`);
            throw createErr;
          }
        } else {
          logger.info(
            "🔄 Étape 5b: Instance existante, modification du sujet..."
          );
          try {
            await stageInstance.edit({ topic: normalizedTopic });
            logger.info(`✅ Sujet modifié: ${normalizedTopic}`);
            stageTopic = true;
          } catch (editErr) {
            logger.error(
              `❌ Erreur lors de la modification: ${editErr.message}`
            );
            logger.error(`Code d'erreur modification: ${editErr.code}`);
            throw editErr;
          }
        }
      } catch (stageErr) {
        logger.error(`❌ Erreur générale stage channel: ${stageErr.message}`);
        logger.error(`Code d'erreur stage: ${stageErr.code}`);

        // Si au moins l'embed a fonctionné, on peut continuer
        if (playlistSent) {
          logger.info("⚠️ Embed envoyé mais stage channel échoué");
          return res.status(200).json({
            status: "PARTIAL",
            message: "Playlist envoyée mais échec du stage channel.",
            playlist: normalizedPlaylist,
            topic: normalizedTopic,
            details: {
              playlistSent: true,
              stageTopic: false,
              error: stageErr.message,
            },
          });
        } else {
          throw stageErr;
        }
      }

      logger.info("=== TRAITEMENT TERMINÉ AVEC SUCCÈS ===");
      return res.status(200).json({
        status: "OK",
        message: "Playlist et stage mis à jour avec succès.",
        playlist: normalizedPlaylist,
        topic: normalizedTopic,
        details: {
          playlistSent,
          stageTopic,
        },
      });
    } catch (err) {
      logger.error(`ERREUR FATALE: ${err.message}`);
      logger.error(`Code: ${err.code}`);
      logger.error(`Stack: ${err.stack}`);
      return res
        .status(500)
        .json({ error: "Erreur serveur lors du traitement." });
    }
  });

  return router;
};

