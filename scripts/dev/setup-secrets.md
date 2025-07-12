# Configuration des Secrets GitHub pour Auto-Deploy

## 🔐 Secrets requis

Pour que l'auto-deploy fonctionne, tu dois configurer ces secrets dans ton repo GitHub :

### 1. Aller dans les Settings du repo

- GitHub → Ton repo → Settings → Secrets and variables → Actions

### 2. Ajouter ces secrets

| Secret                | Description                        | Où le trouver                              |
| --------------------- | ---------------------------------- | ------------------------------------------ |
| `GITHUB_TOKEN`        | Token GitHub (automatique)         | ✅ Déjà configuré                          |
| `DISCORD_TOKEN`       | Token du bot Discord               | Bot Discord Developer Portal               |
| `CLIENT_ID`           | ID du bot Discord                  | Bot Discord Developer Portal               |
| `GUILD_ID`            | ID du serveur Discord              | Serveur Discord (clic droit → Copier l'ID) |
| `DISCORD_WEBHOOK_URL` | Webhook Discord pour notifications | Serveur Discord → Intégrations → Webhooks  |

### 3. Variables d'environnement supplémentaires

Si tu utilises d'autres variables dans ton `.env.prod`, ajoute-les aussi :

| Variable                   | Description                  |
| -------------------------- | ---------------------------- |
| `STREAM_URL`               | URL du stream audio          |
| `JSON_URL`                 | URL de l'API JSON Icecast    |
| `ADMIN_USER_ID`            | ID utilisateur admin Discord |
| `SILENCE_ALERT_CHANNEL_ID` | ID du canal d'alerte silence |

## 🚀 Workflow complet

1. **Développement** : `feature/branch` → `develop`
2. **Tests** : CI/CD sur `develop`
3. **PR** : `develop` → `main` (auto-merge si tests OK)
4. **Déploiement** : Auto sur `main`

## 📝 Utilisation

```bash
# Développer sur une feature branch
git checkout -b feature/nouvelle-fonction
# ... code ...

# Utiliser le script de déploiement
npm run deploy:git
# → Commit + PR automatique
# → Tests automatiques
# → Déploiement auto si OK
```

## 🔧 Configuration des branches

Assure-toi que :

- `develop` est la branche de développement
- `main` est la branche de production
- Les PR vont de `develop` vers `main`

## ⚠️ Permissions GitHub

Le workflow a besoin de permissions pour :

- Lire le contenu du repo
- Écrire sur les branches
- Créer des commits
- Déployer les commandes Discord

Ces permissions sont automatiquement accordées via `GITHUB_TOKEN`.
