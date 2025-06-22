# Scripts Utilitaires - soundSHINE Bot

## 📁 Structure des Scripts

```
scripts/
├── deploy-commands.js      # Déploiement des commandes Discord
├── fix-ephemeral.js        # Correction des messages éphémères
├── git-actions.js          # Simulation des GitHub Actions
├── pre-commit.js           # Vérifications pré-commit
└── run-tests.js            # Exécution de tous les tests
```

## 🚀 Scripts Disponibles

### `deploy-commands.js`
Déploie les commandes slash du bot Discord.

**Usage :**
```bash
# Déploiement en développement
npm run deploy:dev

# Déploiement en production
npm run deploy:prod

# Ou directement
node scripts/deploy-commands.js --dev
node scripts/deploy-commands.js --global
```

**Fonctionnalités :**
- ✅ Déploiement automatique des commandes
- ✅ Gestion des environnements (dev/prod)
- ✅ Validation des commandes
- ✅ Logs détaillés

### `fix-ephemeral.js`
Corrige les problèmes de messages éphémères.

**Usage :**
```bash
npm run fix:ephemeral
```

**Fonctionnalités :**
- ✅ Détection des messages éphémères
- ✅ Correction automatique
- ✅ Validation des corrections

### `git-actions.js`
Simule les GitHub Actions en local.

**Usage :**
```bash
npm run git-actions
```

**Fonctionnalités :**
- ✅ Tests automatisés
- ✅ Linting et formatage
- ✅ Vérification de la syntaxe
- ✅ Validation des fichiers essentiels

### `pre-commit.js`
Vérifications avant commit.

**Usage :**
```bash
npm run pre-push
```

**Fonctionnalités :**
- ✅ Tests rapides
- ✅ Linting
- ✅ Formatage
- ✅ Validation

### `run-tests.js`
Exécute tous les tests du projet.

**Usage :**
```bash
npm run test:all
```

**Fonctionnalités :**
- ✅ Tests unitaires
- ✅ Tests d'intégration
- ✅ Tests de performance
- ✅ Tests de stress

## 🔧 Configuration

### Variables d'Environnement
Les scripts utilisent les variables d'environnement suivantes :

```env
NODE_ENV=development
DISCORD_TOKEN=your-token
CLIENT_ID=your-client-id
API_PORT=3000
```

### Fichiers de Configuration
- `.env` - Variables d'environnement
- `package.json` - Scripts npm
- `.eslintrc.json` - Configuration ESLint

## 📊 Métriques

### Performance
- Temps d'exécution des scripts
- Utilisation des ressources
- Logs de performance

### Qualité
- Couverture de tests
- Conformité du code
- Validation des données

## 🛠️ Développement

### Ajouter un Nouveau Script
1. Créez le fichier dans `scripts/`
2. Ajoutez le script dans `package.json`
3. Documentez l'usage
4. Ajoutez des tests si nécessaire

### Bonnes Pratiques
- ✅ Gestion d'erreurs robuste
- ✅ Logs détaillés
- ✅ Validation des entrées
- ✅ Documentation claire

## 🚨 Dépannage

### Erreurs Communes
1. **Token Discord invalide**
   - Vérifiez la variable `DISCORD_TOKEN`
   - Assurez-vous que le bot a les bonnes permissions

2. **Dépendances manquantes**
   - Exécutez `npm install`
   - Vérifiez `package.json`

3. **Erreurs de linting**
   - Exécutez `npm run lint:fix`
   - Vérifiez la configuration ESLint

### Logs
Les scripts génèrent des logs détaillés :
- Console colorée
- Niveaux de log appropriés
- Informations de débogage

## 📞 Support

Pour toute question concernant les scripts :
- Consultez la documentation
- Vérifiez les logs
- Contactez l'équipe de développement
