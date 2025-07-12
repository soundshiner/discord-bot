# Logger Performant - Documentation

## Vue d'ensemble

Le nouveau logger performant offre des fonctionnalités avancées pour le logging avec une attention particulière portée aux performances, à la rotation des fichiers et au formatage structuré.

## 🚀 Fonctionnalités

### ✅ Performance

- **Logging asynchrone** : Toutes les opérations de logging sont non-bloquantes
- **Batching intelligent** : Regroupement des logs pour réduire les I/O
- **Rotation automatique** : Gestion automatique de la taille et du nombre de fichiers
- **Compression** : Compression automatique des anciens fichiers de log

### ✅ Formatage

- **Formatage structuré** : JSON en production pour faciliter l'analyse
- **Couleurs** : Support des couleurs en développement
- **Timestamps** : Horodatage automatique de tous les logs
- **Métadonnées** : PID, utilisation mémoire, etc.

### ✅ Configuration

- **Variables d'environnement** : Configuration flexible via les variables d'environnement
- **Niveaux de log** : 5 niveaux configurables (error, warn, info, debug, trace)
- **Filtrage** : Filtrage intelligent des données sensibles

## 📋 Configuration

### Variables d'environnement

```bash
# Activation du logging vers fichier
LOG_TO_FILE=true

# Configuration des fichiers
LOG_DIRECTORY=./logs
LOG_MAX_SIZE=10485760  # 10MB
LOG_MAX_FILES=5
LOG_COMPRESS=true
LOG_RETENTION_DAYS=30

# Performance
LOG_BATCH=true
LOG_BATCH_SIZE=10
LOG_BATCH_TIMEOUT=1000

# Formatage
LOG_LEVEL=info
LOG_TIMESTAMP=true
LOG_STRUCTURED=true
LOG_COLORS=true
LOG_INCLUDE_MEMORY=true
LOG_INCLUDE_PID=true

# Métriques
LOG_METRICS=true
LOG_METRICS_INTERVAL=60000
LOG_METRICS_EXPORT=true

# Alertes
LOG_ALERTS=true
LOG_ERROR_THRESHOLD=10
LOG_WARNING_THRESHOLD=50
LOG_ALERT_WINDOW=60000
```

### Configuration par environnement

```javascript
// config/logger.js
export const ENV_CONFIGS = {
  development: {
    file: { enabled: false },
    format: { colors: true, structured: false },
    batch: { enabled: false }
  },

  production: {
    file: { enabled: true },
    format: { colors: false, structured: true },
    batch: { enabled: true }
  },

  test: {
    file: { enabled: false },
    format: { colors: false, structured: true },
    batch: { enabled: false }
  }
};
```

## 🔧 Utilisation

### Méthodes de base

```javascript
import logger from './bot/logger.js';

// Logging de base
await logger.error('Erreur critique', { userId: '123', action: 'login' });
await logger.warn('Avertissement', { resource: 'database' });
await logger.info('Information', { event: 'user_connected' });
await logger.debug('Debug info', { details: 'verbose' });
await logger.trace('Trace détaillé', { stack: 'full' });

// Méthodes spécialisées
await logger.success('Opération réussie');
await logger.infocmd('Commande exécutée');
await logger.custom('CUSTOM', 'Message personnalisé');

// Sections
await logger.section('Démarrage du bot');
await logger.sectionStart('Initialisation');
await logger.summary('Résumé des opérations');
```

### Méthodes pour le bot

```javascript
// Logging spécifique au bot
await logger.bot('Bot démarré');
await logger.command('Commande /play exécutée');
await logger.event('Événement interactionCreate');
await logger.task('Tâche updateStatus');
await logger.api('Requête API /v1/health');
```

### Méthodes synchrones (pour les cas critiques)

```javascript
// Méthodes synchrones pour les cas critiques
logger.errorSync('Erreur critique immédiate');
logger.warnSync('Avertissement immédiat');
logger.infoSync('Information immédiate');
```

## 📊 Métriques

### Récupération des métriques

```javascript
const metrics = logger.getMetrics();

console.log(metrics);
// {
//   totalLogs: 1250,
//   logsByLevel: {
//     error: 5,
//     warn: 12,
//     info: 1200,
//     debug: 33
//   },
//   performance: {
//     avgWriteTime: 2.5,
//     totalWriteTime: 3125,
//     writeCount: 1250
//   },
//   uptime: 3600000
// }
```

### API Endpoints

```bash
# Métriques du logger
GET /v1/logger/metrics

# Statut du logger
GET /v1/logger/status

# Configuration
GET /v1/logger/config

# Test du logger
POST /v1/logger/test
{
  "level": "info",
  "message": "Test message",
  "data": { "test": true }
}

# Forcer le flush du batch
POST /v1/logger/flush
```

## 🔄 Rotation des fichiers

### Configuration automatique

Le logger gère automatiquement la rotation des fichiers :

1. **Taille maximale** : 10MB par défaut
2. **Nombre de fichiers** : 5 fichiers maximum
3. **Compression** : Compression automatique des anciens fichiers
4. **Rétention** : Suppression automatique après 30 jours

### Format des fichiers

```
logs/
├── bot-2025-07-12.log          # Fichier actuel
├── bot-2025-07-12-1752350000.log  # Fichier roté
├── bot-2025-07-12-1752340000.log.gz  # Fichier compressé
└── ...
```

## 🚨 Alertes

### Configuration des alertes

```javascript
// Alertes automatiques basées sur les seuils
LOG_ALERTS=true
LOG_ERROR_THRESHOLD=10      // Alerte si > 10 erreurs/minute
LOG_WARNING_THRESHOLD=50    // Alerte si > 50 warnings/minute
LOG_ALERT_WINDOW=60000      // Fenêtre de 1 minute
```

### Intégration avec le monitoring

```javascript
// Dans core/monitor.js
if (logger.getMetrics().logsByLevel.error > threshold) {
  // Envoyer une alerte
  sendAlert('Trop d\'erreurs détectées');
}
```

## 🔒 Sécurité

### Filtrage des données sensibles

Le logger filtre automatiquement les données sensibles :

```javascript
// Ces données seront automatiquement masquées
await logger.info('Connexion utilisateur', {
  password: 'secret123',        // → [MOT_DE_PASSE_MASQUÉ]
  token: 'abc123...',          // → [TOKEN_MASQUÉ]
  apiKey: 'xyz789...'          // → [CLÉ_API_MASQUÉE]
});
```

### Configuration du filtrage

```javascript
// Patterns de filtrage personnalisés
LOG_FILTER=true
LOG_INCLUDE_ONLY=error,warn,info  // Seulement ces niveaux
```

## 🧪 Tests

### Tests de performance

```bash
# Lancer les tests de performance
npm run test:performance

# Tests spécifiques au logger
npm run test tests/performance/logger.test.js
```

### Métriques de test

```javascript
// Vérifier les performances
const startTime = Date.now();
for (let i = 0; i < 1000; i++) {
  await logger.info(`Test ${i}`);
}
const duration = Date.now() - startTime;
console.log(`1000 logs en ${duration}ms`);
```

## 📈 Monitoring

### Intégration avec Prometheus

```javascript
// Exporter les métriques pour Prometheus
const metrics = logger.getMetrics();
prometheus.gauge('logger_total_logs', metrics.totalLogs);
prometheus.gauge('logger_avg_write_time', metrics.performance.avgWriteTime);
```

### Dashboard Grafana

```javascript
// Requête pour Grafana
{
  "targets": [
    {
      "expr": "logger_total_logs",
      "legendFormat": "Total Logs"
    },
    {
      "expr": "logger_avg_write_time",
      "legendFormat": "Avg Write Time"
    }
  ]
}
```

## 🔧 Migration

### Migration depuis l'ancien logger

Le nouveau logger est compatible avec l'ancien :

```javascript
// Ancien code (toujours fonctionnel)
logger.info('Message');
logger.error('Erreur');

// Nouveau code (recommandé)
await logger.info('Message', { context: 'data' });
await logger.error('Erreur', { stack: error.stack });
```

### Variables d'environnement pour la migration

```bash
# Activer progressivement les nouvelles fonctionnalités
LOG_TO_FILE=false        # Commencer sans fichiers
LOG_BATCH=false         # Désactiver le batching
LOG_STRUCTURED=false    # Garder l'ancien formatage

# Puis activer progressivement
LOG_TO_FILE=true
LOG_BATCH=true
LOG_STRUCTURED=true
```

## 🐛 Dépannage

### Problèmes courants

1. **Logs manquants** : Vérifier `LOG_LEVEL`
2. **Performance lente** : Activer `LOG_BATCH=true`
3. **Fichiers trop gros** : Ajuster `LOG_MAX_SIZE`
4. **Espace disque** : Réduire `LOG_MAX_FILES`

### Debug

```javascript
// Activer le debug
LOG_LEVEL=debug

// Vérifier la configuration
GET /v1/logger/config

// Tester le logger
POST /v1/logger/test
```

## 📚 Références

- [Documentation Winston](https://github.com/winstonjs/winston)
- [Best Practices Logging](https://12factor.net/logs)
- [Structured Logging](https://www.structured-logging.org/)
