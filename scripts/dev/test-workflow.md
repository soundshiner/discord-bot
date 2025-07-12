# Test du Workflow CI/CD Unifié

## 🎯 **Workflow unifié maintenant disponible**

J'ai fusionné les deux workflows en un seul `ci-cd.yml` qui gère :

### **Événements déclenchés**

- ✅ `push` vers `main` ou `develop` → Tests + notifications
- ✅ `pull_request` vers `develop` → Tests + auto-deploy si mergé

### **Jobs intelligents**

- ✅ **Tests** : Linting + tests unitaires + sécurité
- ✅ **Auto-merge** : `develop` → `main` si PR mergée + tests OK
- ✅ **Déploiement** : Auto sur `main` si merge réussi
- ✅ **Notifications** : Discord pour succès/échec

## 🧪 **Comment tester**

### **1. Test simple (push direct)**

```bash
# Sur develop
git checkout develop
git add .
git commit -m "test: test du workflow"
git push origin develop
# → Déclenche tests + notifications
```

### **2. Test auto-deploy (PR)**

```bash
# Créer une feature branch
git checkout -b feature/test-auto-deploy
# ... faire des changements ...
git add .
git commit -m "feat: test auto-deploy"
git push origin feature/test-auto-deploy

# Utiliser le script de déploiement
npm run deploy:git
# → Crée PR develop → main
# → Merge automatique si tests OK
# → Déploiement auto
```

### **3. Test avec le script amélioré**

```bash
# Le script deploy-git.js a été amélioré
node scripts/dev/deploy-git.js
# → Interface interactive
# → Commit + PR automatique
# → Option déploiement auto
```

## 🔧 **Configuration requise**

### **Secrets GitHub (Settings → Secrets)**

- ✅ `DISCORD_TOKEN` - Token du bot
- ✅ `CLIENT_ID` - ID du bot Discord
- ✅ `GUILD_ID` - ID du serveur Discord
- ✅ `DISCORD_WEBHOOK_URL` - Webhook pour notifications

### **Variables d'environnement**

- ✅ `STREAM_URL` - URL du stream audio
- ✅ `JSON_URL` - URL de l'API JSON
- ✅ `ADMIN_USER_ID` - ID admin Discord
- ✅ `SILENCE_ALERT_CHANNEL_ID` - Canal d'alerte

## 📊 **Monitoring**

### **Logs GitHub Actions**

- Actions → Ton repo → Voir les workflows
- Cliquer sur un job pour voir les logs détaillés

### **Notifications Discord**

- ✅ Succès : "🚀 Déploiement Automatique"
- ✅ Échec : "❌ Échec Déploiement Auto"
- ✅ Tests : "🧪 Résultats des Tests"

## 🚀 **Workflow complet**

1. **Développement** : `feature/branch` → `develop`
2. **Tests** : CI/CD automatique sur `develop`
3. **PR** : `develop` → `main` (auto-merge si tests OK)
4. **Déploiement** : Auto sur `main` + notifications Discord

## ⚠️ **Points d'attention**

- **Branches** : Assure-toi que `develop` et `main` existent
- **Permissions** : Le workflow a besoin d'accès en écriture
- **Secrets** : Tous les secrets doivent être configurés
- **Tests** : Les tests doivent passer pour l'auto-deploy

## 🎉 **Avantages**

- ✅ **Un seul workflow** : Plus de conflits
- ✅ **Auto-deploy** : Déploiement automatique si tests OK
- ✅ **Notifications** : Discord pour tous les événements
- ✅ **Sécurité** : Tests + scan de vulnérabilités
- ✅ **Flexibilité** : Push direct OU PR avec auto-deploy
