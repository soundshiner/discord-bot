# 🌍 Variables d'Environnement - soundSHINE Bot

## 📋 Configuration Requise

### Variables Obligatoires

```bash
# Discord Bot Token
DISCORD_TOKEN=your_discord_token_here

# Rôles et Canaux Discord
ADMIN_ROLE_ID=1234567890123456789
VOICE_CHANNEL_ID=1234567890123456789
PLAYLIST_CHANNEL_ID=1234567890123456789

# API Keys
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
STREAM_URL=https://your-stream-url.com
JSON_URL=https://your-json-url.com
```

### Variables Optionnelles

```bash
# Environnement
NODE_ENV=dev|development|staging|prod|production

# Configuration API
API_PORT=3000
API_TOKEN=your_api_token_here

# Configuration Discord
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
DEV_GUILD_ID=your_dev_guild_id_here
BOT_ROLE_NAME=soundSHINE

# Base de données
DB_PATH=./databases/soundshine.sqlite

# Sécurité
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Monitoring
ENABLE_METRICS=true
ENABLE_HEALTH_CHECK=true

# Cache
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Logs
LOG_LEVEL=info|debug|warn|error
```

## 🔧 Fichiers de Configuration

Le bot charge les variables d'environnement dans cet ordre :

1. `.env` (base)
2. `.env.{NODE_ENV}` (spécifique à l'environnement)
3. Variables système

### Exemple de Structure

```
project/
├── .env                    # Configuration de base
├── .env.dev               # Configuration développement
├── .env.staging           # Configuration staging
├── .env.prod              # Configuration production
└── docs/
    └── ENVIRONMENT.md     # Cette documentation
```

## 🚀 Démarrage Rapide

1. **Copier le template** :

```bash
cp .env.example .env
```

2. **Configurer les variables obligatoires** :

```bash
# Éditer .env avec vos valeurs
nano .env
```

3. **Valider la configuration** :

```bash
npm run test:optimizations
```

## 🔍 Validation

Le système valide automatiquement :

- ✅ **Format des tokens** Discord
- ✅ **Format des IDs** (17-20 chiffres)
- ✅ **URLs valides** pour les streams
- ✅ **Ports valides** (1-65535)
- ✅ **Types de données** corrects

## 🛡️ Sécurité

### Variables Sensibles

```bash
# Ne jamais commiter dans Git
DISCORD_TOKEN=xxx
API_TOKEN=xxx
UNSPLASH_ACCESS_KEY=xxx
```

### Bonnes Pratiques

- 🔒 Utiliser des tokens forts
- 🔒 Limiter les permissions Discord
- 🔒 Configurer CORS approprié
- 🔒 Activer le rate limiting
- 🔒 Monitorer les accès

## 📊 Monitoring

### Health Check

```bash
# Vérifier l'état du système
curl http://localhost:3000/v1/health
```

### Métriques

```bash
# Récupérer les métriques
curl http://localhost:3000/v1/metrics
```

## 🔧 Dépannage

### Erreurs Courantes

1. **Token Discord invalide**

   ```
   Error: Token Discord invalide
   Solution: Vérifier le token dans le portail développeur Discord
   ```

2. **ID de rôle invalide**

   ```
   Error: ID de rôle admin invalide
   Solution: Utiliser l'ID numérique du rôle (17-20 chiffres)
   ```

3. **URL invalide**
   ```
   Error: URL de stream invalide
   Solution: Vérifier le format de l'URL (https://...)
   ```

### Validation Manuelle

```bash
# Tester la configuration
npm run test:optimizations

# Vérifier les logs
npm run dev
```

## 📝 Exemple Complet

```bash
# .env
NODE_ENV=development
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA.GhIjKl.MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz
ADMIN_ROLE_ID=1234567890123456789
VOICE_CHANNEL_ID=1234567890123456789
PLAYLIST_CHANNEL_ID=1234567890123456789
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
STREAM_URL=https://stream.example.com/live
JSON_URL=https://api.example.com/data.json
API_PORT=3000
LOG_LEVEL=info
```

## 🔄 Migration

### Ancienne Configuration

Si vous migrez depuis une version précédente :

1. **Variables renommées** :

   - `TOKEN` → `DISCORD_TOKEN`
   - `API_PORT` → `API_PORT` (inchangé)

2. **Nouvelles validations** :

   - Format strict des IDs Discord
   - Validation des URLs
   - Types de données typés

3. **Compatibilité** :
   - Les anciennes variables sont supportées
   - Migration automatique des valeurs
   - Logs de migration détaillés

## 📞 Support

Pour toute question sur la configuration :

- 📖 Documentation complète
- 🐛 Issues GitHub
- 💬 Discord Community
