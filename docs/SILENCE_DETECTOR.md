# 🔇 Détecteur de Silence - soundSHINE Bot

## Vue d'ensemble

Le détecteur de silence est un système de surveillance automatique qui surveille l'activité audio du stream et envoie des alertes en cas de silence prolongé. Il utilise l'API JSON d'Icecast pour détecter l'activité audio et envoie des notifications Discord en message privé.

## 🚀 Fonctionnalités

### ✅ Détection automatique

- Surveillance continue de l'activité audio
- Détection via l'API JSON d'Icecast
- Seuil de silence configurable (défaut: 5 secondes)
- Intervalle de vérification configurable (défaut: 10 secondes)

### ✅ Alertes Discord

- Messages privés aux administrateurs
- Messages dans un canal d'alerte configuré
- Alertes de restauration audio
- Test d'alerte intégré

### ✅ Configuration flexible

- Variables d'environnement
- Commande Discord `/silence`
- API REST complète
- Métriques en temps réel

## 📋 Configuration

### Variables d'environnement

```bash
# Seuil de silence en millisecondes (défaut: 5000)
SILENCE_THRESHOLD=5000

# Intervalle de vérification en millisecondes (défaut: 10000)
SILENCE_CHECK_INTERVAL=10000

# Activer/désactiver les alertes (défaut: true)
SILENCE_ALERTS_ENABLED=true

# ID du canal d'alerte Discord (optionnel)
SILENCE_ALERT_CHANNEL_ID=1234567890123456789

# ID de l'utilisateur administrateur principal (optionnel)
ADMIN_USER_ID=1234567890123456789
```

### Configuration recommandée

```bash
# Pour une surveillance stricte
SILENCE_THRESHOLD=3000        # 3 secondes
SILENCE_CHECK_INTERVAL=5000   # Vérification toutes les 5 secondes

# Pour une surveillance standard
SILENCE_THRESHOLD=5000        # 5 secondes
SILENCE_CHECK_INTERVAL=10000  # Vérification toutes les 10 secondes

# Pour une surveillance relaxée
SILENCE_THRESHOLD=10000       # 10 secondes
SILENCE_CHECK_INTERVAL=15000  # Vérification toutes les 15 secondes
```

## 🎮 Commandes Discord

### `/silence start`

Démarre la surveillance du silence.

### `/silence stop`

Arrête la surveillance du silence.

### `/silence status`

Affiche le statut détaillé du détecteur.

### `/silence config [threshold] [interval]`

Configure le détecteur de silence :

- `threshold` : Seuil de silence en secondes (1-300)
- `interval` : Intervalle de vérification en secondes (5-60)

### `/silence add-alert <user>`

Ajoute un utilisateur aux destinataires d'alerte.

### `/silence remove-alert <user>`

Supprime un utilisateur des destinataires d'alerte.

### `/silence test`

Envoie un test d'alerte aux destinataires configurés.

## 🌐 API REST

### Endpoints disponibles

#### `GET /v1/silence/status`

Obtenir le statut du détecteur de silence.

**Réponse :**

```json
{
  "success": true,
  "data": {
    "isMonitoring": true,
    "silenceThreshold": 5000,
    "checkInterval": 10000,
    "lastAudioActivity": 1640995200000,
    "silenceStartTime": null,
    "alertSent": false,
    "alertRecipients": ["1234567890123456789"],
    "config": {
      "enableAlerts": true,
      "alertChannelId": "1234567890123456789",
      "adminUserId": "1234567890123456789"
    },
    "uptime": 3600000,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### `POST /v1/silence/start`

Démarrer la surveillance du silence.

#### `POST /v1/silence/stop`

Arrêter la surveillance du silence.

#### `POST /v1/silence/config`

Configurer le détecteur de silence.

**Corps de la requête :**

```json
{
  "threshold": 5,
  "interval": 10,
  "enableAlerts": true,
  "alertChannelId": "1234567890123456789",
  "adminUserId": "1234567890123456789"
}
```

#### `POST /v1/silence/test`

Tester le système d'alerte.

#### `GET /v1/silence/metrics`

Obtenir les métriques du détecteur de silence.

**Réponse :**

```json
{
  "success": true,
  "data": {
    "isMonitoring": 1,
    "alertSent": 0,
    "alertRecipientsCount": 2,
    "silenceDuration": 0,
    "lastAudioActivity": 30,
    "config": {
      "silenceThreshold": 5000,
      "checkInterval": 10000,
      "enableAlerts": 1
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🔧 Intégration

### Démarrage automatique

Pour démarrer automatiquement le détecteur de silence au lancement du bot, ajoutez ce code dans `bot/startup.js` :

```javascript
// Après l'initialisation du bot
import getSilenceDetector from '../core/services/SilenceDetector.js';

// Démarrer le détecteur de silence
const silenceDetector = getSilenceDetector();
silenceDetector.startMonitoring();
```

### Intégration avec le monitoring

Le détecteur de silence s'intègre avec le système de monitoring existant :

```javascript
// Dans core/monitor.js
import getSilenceDetector from './services/SilenceDetector.js';

// Ajouter les métriques du détecteur de silence
const silenceDetector = getSilenceDetector();
const silenceStatus = silenceDetector.getStatus();

// Ajouter aux métriques globales
metrics.silenceDetector = {
  isMonitoring: silenceStatus.isMonitoring,
  alertSent: silenceStatus.alertSent,
  recipientsCount: silenceStatus.alertRecipients.length
};
```

## 🚨 Alertes

### Format des alertes

#### Alerte de silence

```
🔇 **ALERTE SILENCE**

Le stream audio est silencieux depuis **5 secondes**.
⏰ Détecté à: 01/01/2024, 12:00:00
🔗 Stream URL: https://stream.example.com

Vérifiez immédiatement l'état du stream.
```

#### Alerte de restauration

```
🔊 **AUDIO RESTAURÉ**

Le stream audio fonctionne à nouveau normalement.
⏰ Restauré à: 01/01/2024, 12:05:00
✅ Le problème de silence est résolu.
```

### Destinataires

1. **Administrateur principal** : Utilisateur configuré via `ADMIN_USER_ID`
2. **Destinataires ajoutés** : Utilisateurs ajoutés via `/silence add-alert`
3. **Canal d'alerte** : Canal configuré via `SILENCE_ALERT_CHANNEL_ID`

## 📊 Métriques

### Métriques disponibles

- `isMonitoring` : État de surveillance (0/1)
- `alertSent` : Alerte envoyée (0/1)
- `alertRecipientsCount` : Nombre de destinataires
- `silenceDuration` : Durée du silence en secondes
- `lastAudioActivity` : Temps écoulé depuis la dernière activité
- `silenceThreshold` : Seuil configuré
- `checkInterval` : Intervalle de vérification
- `enableAlerts` : Alertes activées (0/1)

### Monitoring Prometheus

```javascript
// Exemple d'export Prometheus
const silenceMetrics = {
  soundshine_silence_monitoring: silenceStatus.isMonitoring ? 1 : 0,
  soundshine_silence_alert_sent: silenceStatus.alertSent ? 1 : 0,
  soundshine_silence_recipients: silenceStatus.alertRecipients.length,
  soundshine_silence_duration: silenceDuration,
  soundshine_silence_threshold: silenceStatus.silenceThreshold,
  soundshine_silence_interval: silenceStatus.checkInterval
};
```

## 🔍 Dépannage

### Problèmes courants

#### 1. Le détecteur ne démarre pas

- Vérifiez que `SILENCE_ALERTS_ENABLED` n'est pas défini à `false`
- Vérifiez les logs pour les erreurs de configuration
- Assurez-vous que l'API JSON est accessible

#### 2. Alertes non envoyées

- Vérifiez que `ADMIN_USER_ID` est configuré
- Vérifiez les permissions du bot pour envoyer des messages privés
- Vérifiez que le client Discord est disponible

#### 3. Fausses alertes

- Ajustez le `SILENCE_THRESHOLD` pour être moins sensible
- Vérifiez la qualité de l'API JSON
- Augmentez l'intervalle de vérification

#### 4. Performance

- Réduisez la fréquence de vérification si nécessaire
- Surveillez l'utilisation mémoire
- Vérifiez les logs pour les erreurs de réseau

### Logs utiles

```bash
# Vérifier les logs du détecteur
grep "SilenceDetector" logs/bot.log

# Vérifier les erreurs
grep "ERROR.*silence" logs/bot.log

# Vérifier les alertes envoyées
grep "Alerte de silence envoyée" logs/bot.log
```

## 🛡️ Sécurité

### Bonnes pratiques

1. **Permissions minimales** : Le bot n'a besoin que des permissions de lecture et d'envoi de messages
2. **Validation des IDs** : Tous les IDs Discord sont validés avant utilisation
3. **Gestion d'erreur** : Toutes les erreurs sont loggées et gérées gracieusement
4. **Rate limiting** : Les alertes sont limitées pour éviter le spam
5. **Configuration sécurisée** : Les variables sensibles sont dans les variables d'environnement

### Variables sensibles

```bash
# À ne jamais exposer publiquement
SILENCE_ALERT_CHANNEL_ID=1234567890123456789
ADMIN_USER_ID=1234567890123456789
```

## 📈 Évolutions futures

### Fonctionnalités prévues

- [ ] **Alertes par email** : Intégration SMTP
- [ ] **Alertes Slack** : Webhook Slack
- [ ] **Alertes SMS** : Intégration Twilio
- [ ] **Historique des alertes** : Base de données
- [ ] **Alertes intelligentes** : IA pour réduire les faux positifs
- [ ] **Alertes par niveau** : Warning/Critical/Fatal
- [ ] **Alertes par équipe** : Gestion des équipes de support
- [ ] **Alertes géolocalisées** : Basées sur le fuseau horaire

### Améliorations techniques

- [ ] **Cache Redis** : Pour les métriques en temps réel
- [ ] **Queue de messages** : Pour la fiabilité des alertes
- [ ] **Monitoring avancé** : Métriques Prometheus complètes
- [ ] **Tests automatisés** : Suite de tests complète
- [ ] **Documentation API** : Swagger/OpenAPI
- [ ] **Interface web** : Dashboard de monitoring

## 📞 Support

Pour toute question ou problème avec le détecteur de silence :

1. Vérifiez les logs dans `logs/bot.log`
2. Testez avec `/silence test`
3. Vérifiez la configuration avec `/silence status`
4. Consultez les métriques via `/v1/silence/metrics`
5. Ouvrez une issue sur GitHub avec les logs d'erreur
