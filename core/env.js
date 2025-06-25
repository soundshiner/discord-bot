// core/env.js
// Vérification basique des variables d'environnement essentielles

const requiredEnvVars = [
    'BOT_TOKEN',
    'CLIENT_ID',
    'GUILD_ID',
    'API_PORT',
    'API_TOKEN',
    'PLAYLIST_CHANNEL_ID',
    'VOICE_CHANNEL_ID'
  ];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`La variable d'environnement ${varName} est requise mais non définie.`);
    }
  }
  
  export default process.env;
  