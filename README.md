# soundSHINE Bot

Bot Discord pour la gestion de playlists et de musique.

## 🚀 Installation rapide

### Option 1 : Installation simple

```bash
# 1. Cloner le repo
git clone https://github.com/votre-username/soundshine-bot.git
cd soundshine-bot

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos tokens Discord

# 4. Démarrer le bot
npm run dev / prod
```

## ⚙️ Configuration

Créez un fichier `.env` avec vos tokens :

```env
# Discord (obligatoire)
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# API (optionnel)
API_TOKEN=your_api_token_here

# Channels Discord (optionnel)
VOICE_CHANNEL_ID=your_voice_channel_id
PLAYLIST_CHANNEL_ID=your_playlist_channel_id

# Services externes (optionnel)
UNSPLASH_ACCESS_KEY=your_unsplash_key
STREAM_URL=your_stream_url
```

## 📋 Commandes disponibles

```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement
npm test           # Lancer les tests
npm run lint       # Vérifier le code
```

## 🔧 Développement

```bash
# Installer les dépendances de développement
npm install

# Lancer en mode développement
npm run dev

# Lancer les tests
npm test

# Vérifier le code
npm run lint
```

## 📚 Documentation

- [Guide de configuration Discord](docs/discord-setup.md)
- [API Reference](docs/api.md)
- [Commandes disponibles](docs/commands.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## 📄 Licence

Ce projet est sous licence ISC. Voir [LICENSE](LICENSE) pour plus de détails.
