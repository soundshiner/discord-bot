# Configuration du GITHUB_TOKEN pour Auto-Deploy

## 🔐 **Problème**

```
❌ Il faut définir la variable d'environnement GITHUB_TOKEN pour créer une PR.
```

## 🎯 **Solution : Créer un token GitHub**

### **1. Aller sur GitHub**

- Va sur [GitHub.com](https://github.com)
- Clique sur ton avatar → Settings
- Developer settings → Personal access tokens → Tokens (classic)

### **2. Créer un nouveau token**

- Clique "Generate new token (classic)"
- **Note** : `soundshine-bot-deploy`
- **Expiration** : 90 jours (recommandé)
- **Permissions** :
  - ✅ `repo` (accès complet aux repos)
  - ✅ `workflow` (pour les GitHub Actions)

### **3. Copier le token**

- Clique "Generate token"
- **IMPORTANT** : Copie le token immédiatement (tu ne le reverras plus !)
- Il ressemble à : `ghp_1234567890abcdef...`

## 📝 **Ajouter le token à ton .env**

### **Dans ton fichier `.env.dev` :**

```bash
# Ajouter cette ligne
GITHUB_TOKEN=ghp_ton_token_ici
```

### **Dans ton fichier `.env.prod` :**

```bash
# Ajouter cette ligne
GITHUB_TOKEN=ghp_ton_token_ici
```

## 🧪 **Tester la configuration**

```bash
# Tester le script de déploiement
node scripts/dev/deploy-git.js
```

Si ça marche, tu verras :

```
✅ PR créée: https://github.com/ton-repo/pull/123
```

## ⚠️ **Sécurité**

- **Ne jamais commiter** le token dans Git
- **Utiliser des tokens temporaires** (90 jours max)
- **Permissions minimales** : seulement `repo` et `workflow`
- **Rotation régulière** : changer le token tous les 3 mois

## 🔄 **Alternative : Token d'organisation**

Si tu veux plus de sécurité, tu peux créer un token d'organisation :

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. **Repository access** : Only select repositories
3. **Permissions** :
   - Repository permissions → Contents → Read and write
   - Repository permissions → Pull requests → Read and write

## 🚀 **Workflow complet**

Une fois configuré :

1. **Développement** : `feature/branch` → `develop`
2. **Script** : `npm run deploy:git` → Crée PR automatiquement
3. **Tests** : CI/CD automatique sur la PR
4. **Merge** : Auto si tests OK
5. **Déploiement** : Auto sur `main`

## ❓ **Problèmes courants**

### **Token expiré**

```
❌ Bad credentials
```

→ Recréer un nouveau token

### **Permissions insuffisantes**

```
❌ Resource not accessible by integration
```

→ Vérifier les permissions `repo` et `workflow`

### **Token mal formaté**

```
❌ Invalid token format
```

→ Vérifier que le token commence par `ghp_`
