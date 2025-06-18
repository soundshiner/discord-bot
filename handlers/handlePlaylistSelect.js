import fetch from "node-fetch"; // ou 'undici' si tu préfères, ou fetch natif en Node 18+

// Remplace cette fonction par ton check Arcane réel
function userHasArcaneLevel(user, requiredLevel = 25) {
  // Ici tu implémentes ton check (exemple fictif)
  // Par défaut on autorise pour l’exemple
  return true;
}

export default async function handlePlaylistSelect(interaction) {
  const playlistName = interaction.values[0];

  if (!userHasArcaneLevel(interaction.user, 25)) {
    return interaction.reply({
      content: "❌ Tu n’as pas le niveau 25 requis pour lancer une playlist.",
      ephemeral: true,
    });
  }

  try {
    const response = await fetch(
      "http://localhost:3000/v1/liquidsoap/playlist/start",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistName }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return interaction.reply({
        content: `❌ Erreur : ${
          data.message || "Impossible de lancer la playlist."
        }`,
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `🎵 Playlist "${playlistName}" lancée avec succès !`,
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      content: `❌ Erreur réseau : ${error.message}`,
      ephemeral: true,
    });
  }
}
