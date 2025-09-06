# Fonctionnalités des Stages - Discord Bot

## 🎭 Déconnexion Automatique

### Fonctionnement
Le bot surveille automatiquement les stages channels où il est connecté. Si aucun utilisateur humain n'est présent dans le stage (seulement des bots), le bot se déconnecte automatiquement après 30 secondes.

### Configuration
- **Intervalle de vérification** : 30 secondes
- **Déclenchement** : Aucun humain dans le stage
- **Action** : Déconnexion automatique + nettoyage des ressources

### Fichiers impliqués
- `core/services/StageMonitor.js` - Service principal de surveillance
- `bot/events/voiceStateUpdate.js` - Gestion des événements vocaux
- `bot/startup.js` - Initialisation du service

## 🎤 Auto-promotion en Speaker

### Permissions Requises
Pour que le bot puisse s'auto-promouvoir en speaker, il doit avoir les permissions suivantes dans le stage channel :

1. **Se connecter** (`Connect`)
2. **Parler** (`Speak`) 
3. **Demander à parler** (`RequestToSpeak`)

### Fonctionnement
- Lors de la connexion au stage via `/radio play`, le bot tente automatiquement de se promouvoir en speaker
- Si les permissions sont insuffisantes, un message d'erreur détaillé est affiché
- La promotion utilise `connection.voice.setSuppressed(false)` (discord.js v14)

### Commandes Disponibles

#### `/station speaker-status`
Vérifie le statut actuel du bot dans le stage :
- Statut de connexion
- Statut speaker/auditeur
- Permissions disponibles
- Possibilité d'auto-promotion

#### `/station promote-speaker` (Admin uniquement)
Force manuellement la promotion du bot en speaker.

### Fichiers impliqués
- `core/services/StageSpeakerManager.js` - Gestion des permissions et promotion
- `bot/commands/station/speaker-status.js` - Commande de vérification
- `bot/commands/station/promote-speaker.js` - Commande de promotion manuelle
- `bot/events/handlers/SpecialCommandHandler.js` - Intégration avec la commande play

## 🔧 Configuration

### Variables d'environnement
Aucune variable d'environnement supplémentaire n'est requise. Les services utilisent la configuration existante du bot.

### Permissions Discord
Assurez-vous que le bot a les permissions suivantes dans votre serveur :
- `Connect` - Se connecter aux canaux vocaux
- `Speak` - Parler dans les canaux vocaux  
- `RequestToSpeak` - Demander à parler dans les stages
- `Send Messages` - Envoyer des messages (pour les logs)

## 📝 Logs

### Messages de log
- `🎭` - Surveillance des stages
- `🎤` - Gestion des speakers
- `📡` - Connexions vocales

### Niveaux de log
- `INFO` - Connexions/déconnexions normales
- `WARN` - Permissions manquantes, échecs de promotion
- `ERROR` - Erreurs critiques, déconnexions forcées

## 🚀 Utilisation

### Démarrage automatique
Les services se lancent automatiquement avec le bot via `bot/startup.js`.

### Surveillance continue
- Le `StageMonitor` vérifie toutes les 30 secondes
- Les événements `voiceStateUpdate` déclenchent des vérifications immédiates
- Nettoyage automatique des stages déconnectés

### Gestion des erreurs
- Erreurs de permissions : Messages détaillés avec permissions manquantes
- Erreurs de connexion : Nettoyage automatique des ressources
- Erreurs de promotion : Fallback gracieux sans interruption du stream

## 🔍 Dépannage

### Le bot ne se déconnecte pas automatiquement
1. Vérifiez que le service `StageMonitor` est actif
2. Vérifiez les logs pour des erreurs de surveillance
3. Assurez-vous qu'il n'y a vraiment aucun humain dans le stage

### L'auto-promotion échoue
1. Utilisez `/station speaker-status` pour diagnostiquer
2. Vérifiez les permissions du bot dans le stage
3. Assurez-vous que le bot est connecté au stage
4. Vérifiez que le stage est bien un "Stage Channel" et non un canal vocal normal

### Erreurs de permissions
Les permissions manquantes sont listées dans les messages d'erreur. Accordez les permissions manquantes au rôle du bot dans les paramètres du stage channel.
