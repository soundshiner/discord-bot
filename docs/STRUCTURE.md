# Structure du Projet soundSHINE Bot

## Vue d'ensemble

Ce document décrit la nouvelle structure du projet soundSHINE Bot après refactorisation.

## Arborescence

```
soundshine-bot/
├── .env                          # Variables d'environnement
├── README.md                     # Documentation principale
├── index.js                      # Point d'entrée principal
│
├── bot/                          # Module principal du bot Discord
│   ├── client.js                 # Instance Discord.js avec intents et options
│   ├── config.js                 # Configuration spécifique au bot
│   ├── logger.js                 # Système de logging unifié
│   ├── startup.js                # Initialisation du bot
│   ├── handlers/
│   │   ├── loadCommands.js       # Chargement des commandes
│   │   ├── loadEvents.js         # Chargement des événements
│   │   └── handlePlaylistSelect.js
│   ├── commands/                 # Toutes les commandes Discord
│   │   ├── ping.js
│   │   ├── play.js
│   │   ├── stop.js
│   │   ├── stats.js
│   │   ├── schedule.js
│   │   ├── suggest.js
│   │   ├── suggest-list.js
│   │   ├── suggest-edit.js
│   │   ├── suggest-delete.js
│   │   ├── nowplaying.js
│   │   ├── getwallpaper.js
│   │   └── drink.js
│   ├── events/                   # Événements Discord
│   │   └── interactionCreate.js
│   └── tasks/                    # Tâches planifiées
│       ├── logMemory.js
│       └── updateStatus.js
│
├── api/                          # Serveur Express API
│   ├── index.js                  # Point d'entrée du serveur (ancien server.js)
│   ├── middlewares/              # Middlewares Express
│   ├── routes/                   # Routes API
│   └── routes.js                 # Configuration des routes
│
├── core/                         # Logique de démarrage globale
│   ├── lifecycle.js              # Gestion du cycle de vie
│   ├── metrics.js                # Métriques système
│   └── monitor.js                # Surveillance et gestion d'erreurs
│
├── utils/                        # Utilitaires partagés
│   ├── alerts.js                 # Système d'alertes
│   ├── cache.js                  # Système de cache
│   ├── checkStreamOnline.js      # Vérification de stream
│   ├── globalConfig.js           # Configuration globale
│   ├── database.js               # Accès base de données
│   ├── genres.js                 # Gestion des genres musicaux
│   ├── socialChannel.js          # Gestion des canaux sociaux
│   ├── validateURL.js            # Validation d'URLs
│   └── handlers/                 # Handlers utilitaires
│
├── data/                         # Données statiques
│   ├── schedule.txt
│   └── suggestions.db
│
├── scripts/                      # Outils de développement
│   ├── bot/                      # Scripts spécifiques au bot
│   ├── dev/                      # Scripts de développement
│   ├── git/                      # Scripts Git
│   └── infra/                    # Scripts d'infrastructure
│
├── config/                       # Fichiers de configuration
│   ├── eslint.config.js
│   ├── jest.config.js
│   ├── vitest.config.js
│   ├── .gitconfig
│   ├── .eslintrc.json
│   ├── .dockerignore
│   ├── .gitignore
│   └── .gitattributes
│
├── docker/                       # Configuration Docker
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── tests/                        # Tests
│   ├── README.md
│   ├── setup.js
│   ├── vitest.setup.js
│   ├── integration/
│   ├── mocks/
│   ├── performance/
│   └── stress/
│
└── docs/                         # Documentation
    ├── STRUCTURE.md              # Ce fichier
    ├── PLAN_OPTIMISATION.md
    └── SECURITY.md
```

## Changements principaux

### 1. Séparation Bot/API

- **`bot/`** : Tout ce qui concerne le bot Discord
- **`api/`** : Serveur Express et API REST
- **`core/`** : Logique de démarrage globale

### 2. Configuration centralisée

- **`bot/config.js`** : Configuration spécifique au bot
- **`utils/globalConfig.js`** : Configuration globale partagée
- **`config/`** : Fichiers de configuration des outils

### 3. Logging unifié

- **`bot/logger.js`** : Système de logging centralisé
- Fusion des fonctionnalités de `utils/logger.js` et `helpers/logger.js`

### 4. Gestion d'erreurs améliorée

- **`core/monitor.js`** : Surveillance et gestion d'erreurs centralisée
- Remplace `utils/errorHandler.js`

### 5. Organisation des fichiers

- **`docker/`** : Configuration Docker centralisée
- **`config/`** : Fichiers de configuration des outils
- **`docs/`** : Documentation centralisée

## Points d'entrée

### Bot Discord

```javascript
// bot/startup.js
import { startBot } from './bot/startup.js';
const client = await startBot();
```

### API Express

```javascript
// api/index.js
import WebServer from './api/index.js';
const server = new WebServer(client, logger);
server.start(port);
```

### Point d'entrée principal

```javascript
// index.js
import { startBot } from './bot/startup.js';
import WebServer from './api/index.js';

const botClient = await startBot();
const apiServer = new WebServer(botClient, logger);
apiServer.start(config.apiPort);
```

## Imports mis à jour

### Logger

```javascript
// Avant
import logger from '../utils/logger.js';

// Après
import logger from '../logger.js';           // Dans bot/
import logger from '../bot/logger.js';       // Dans autres modules
```

### Configuration

```javascript
// Avant
import config from '../utils/config.js';

// Après
import config from '../utils/globalConfig.js';
```

### Gestion d'erreurs

```javascript
// Avant
import errorHandler from '../utils/errorHandler.js';

// Après
import monitor from '../core/monitor.js';
```

## Avantages de la nouvelle structure

1. **Séparation claire** : Bot et API sont maintenant séparés
2. **Maintenabilité** : Code mieux organisé et plus facile à maintenir
3. **Évolutivité** : Structure modulaire permettant l'ajout de nouvelles fonctionnalités
4. **Configuration** : Gestion centralisée des configurations
5. **Logging** : Système de logging unifié et cohérent
6. **Docker** : Configuration Docker centralisée
7. **Documentation** : Documentation centralisée et organisée
