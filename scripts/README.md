# Scripts de Vérification Locale

Ce dossier contient des scripts pour simuler les GitHub Actions localement avant de push.

## Scripts Disponibles

### 1. `git-actions.js` - Simulation complète des GitHub Actions

**Commande :** `npm run git-actions`

**Ce que fait le script :**

- ✅ Vérifie les fichiers essentiels
- 📦 Installe les dépendances si nécessaire
- 🔍 Exécute le linting (ESLint)
- 🧪 Lance tous les tests (unitaires, intégration, performance)
- 📝 Vérifie le formatage (Prettier)
- 🔧 Vérifie la syntaxe Node.js
- 🐳 Vérifie Docker (si disponible)

**Utilisation :**

```bash
# Avant de push, pour vérifier que tout fonctionne
npm run git-actions
```

### 2. `pre-commit.js` - Vérifications rapides

**Commande :** `npm run pre-push`

**Ce que fait le script :**

- 🔍 Linting rapide
- 📝 Vérification formatage
- 🧪 Tests unitaires (sans couverture)

**Utilisation :**

```bash
# Vérifications rapides avant commit/push
npm run pre-push
```

## Workflow Recommandé

### Avant chaque commit :

```bash
# 1. Vérifications rapides
npm run pre-push

# 2. Si tout va bien, commit
git add .
git commit -m "feat: your message"

# 3. Vérifications complètes avant push
npm run git-actions

# 4. Si tout va bien, push
git push origin main
```

### Intégration avec Git Hooks (Optionnel)

Pour automatiser les vérifications, vous pouvez installer Husky :

```bash
# Installation de Husky
npm install --save-dev husky

# Configuration des hooks
npx husky install
npx husky add .husky/pre-commit "npm run pre-push"
npx husky add .husky/pre-push "npm run git-actions"
```

## Variables d'Environnement de Test

Les scripts utilisent automatiquement des variables d'environnement de test :

```javascript
{
  NODE_ENV: 'test',
  DISCORD_TOKEN: 'test-token',
  CLIENT_ID: 'test-client-id',
  API_PORT: '3000',
  // ... autres variables de test
}
```

## Résolution des Problèmes

### Erreur "Dépendances non installées"

```bash
npm install
```

### Erreurs de linting

```bash
npm run lint:fix
```

### Erreurs de formatage

```bash
npm run format
```

### Tests qui échouent

```bash
npm run test
```

## Avantages

1. **Détection précoce** : Trouvez les problèmes avant qu'ils n'arrivent sur GitHub
2. **Économie de temps** : Pas besoin d'attendre les GitHub Actions
3. **Développement plus fluide** : Feedback immédiat
4. **Qualité de code** : Maintient des standards élevés

## Notes

- Les scripts sont conçus pour être compatibles avec Windows, macOS et Linux
- Docker est optionnel (le script continue même si Docker n'est pas installé)
- Les erreurs sont clairement affichées avec des suggestions de correction
