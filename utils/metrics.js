// ========================================
// utils/metrics.js - Système de métriques Prometheus
// ========================================

import { register, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import logger from './logger.js';

class MetricsCollector {
  constructor() {
    this.register = register;

    // Métriques Discord
    this.discordPing = new Gauge({
      name: 'discord_ping_ms',
      help: 'Latence Discord en millisecondes',
      labelNames: ['guild_id']
    });

    this.discordGuilds = new Gauge({
      name: 'discord_guilds_total',
      help: 'Nombre total de serveurs Discord'
    });

    this.discordUsers = new Gauge({
      name: 'discord_users_total',
      help: 'Nombre total d\'utilisateurs'
    });

    this.discordCommands = new Counter({
      name: 'discord_commands_total',
      help: 'Nombre total de commandes exécutées',
      labelNames: ['command_name', 'guild_id']
    });

    // Métriques du bot
    this.botUptime = new Gauge({
      name: 'bot_uptime_seconds',
      help: 'Temps de fonctionnement du bot en secondes'
    });

    this.botMemoryUsage = new Gauge({
      name: 'bot_memory_bytes',
      help: 'Utilisation mémoire du bot',
      labelNames: ['type'] // heapUsed, heapTotal, external, rss
    });

    // Métriques API
    this.apiRequests = new Counter({
      name: 'api_requests_total',
      help: 'Nombre total de requêtes API',
      labelNames: ['method', 'endpoint', 'status_code']
    });

    this.apiRequestDuration = new Histogram({
      name: 'api_request_duration_seconds',
      help: 'Durée des requêtes API',
      labelNames: ['method', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    // Métriques d'erreurs
    this.errors = new Counter({
      name: 'bot_errors_total',
      help: 'Nombre total d\'erreurs',
      labelNames: ['error_type', 'context']
    });

    // Métriques de cache
    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Nombre total de hits du cache'
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Nombre total de misses du cache'
    });

    this.cacheSize = new Gauge({
      name: 'cache_size_total',
      help: 'Taille actuelle du cache'
    });

    // Métriques de performance
    this.voiceConnections = new Gauge({
      name: 'voice_connections_total',
      help: 'Nombre de connexions vocales actives'
    });

    this.streamStatus = new Gauge({
      name: 'stream_online',
      help: 'Statut du stream (1 = online, 0 = offline)'
    });

    // Collecter les métriques par défaut du système
    collectDefaultMetrics({ register: this.register });

    logger.info('📊 Système de métriques Prometheus initialisé');
  }

  /**
   * Mettre à jour les métriques Discord
   */
  updateDiscordMetrics(client) {
    if (!client) return;

    try {
      // Ping Discord
      const ping = client.ws?.ping || 0;
      this.discordPing.set(ping);

      // Nombre de serveurs
      const guilds = client.guilds?.cache?.size || 0;
      this.discordGuilds.set(guilds);

      // Nombre d'utilisateurs
      const users = client.users?.cache?.size || 0;
      this.discordUsers.set(users);

      // Connexions vocales
      const voiceConnections = client.voice?.adapters?.size || 0;
      this.voiceConnections.set(voiceConnections);

      // Uptime du bot
      const uptime = client.uptime || 0;
      this.botUptime.set(uptime / 1000); // Convertir en secondes

      logger.debug('Métriques Discord mises à jour');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des métriques Discord:', error);
    }
  }

  /**
   * Mettre à jour les métriques système
   */
  updateSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();

      this.botMemoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
      this.botMemoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
      this.botMemoryUsage.set({ type: 'external' }, memUsage.external);
      this.botMemoryUsage.set({ type: 'rss' }, memUsage.rss);

      logger.debug('Métriques système mises à jour');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des métriques système:', error);
    }
  }

  /**
   * Enregistrer une requête API
   */
  recordApiRequest(method, endpoint, statusCode, duration) {
    try {
      this.apiRequests.inc({ method, endpoint, status_code: statusCode });
      this.apiRequestDuration.observe({ method, endpoint }, duration / 1000); // Convertir en secondes
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de la requête API:', error);
    }
  }

  /**
   * Enregistrer une commande Discord
   */
  recordCommand(commandName, guildId = 'dm') {
    try {
      this.discordCommands.inc({ command_name: commandName, guild_id: guildId });
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de la commande:', error);
    }
  }

  /**
   * Enregistrer une erreur
   */
  recordError(errorType, context = 'unknown') {
    try {
      this.errors.inc({ error_type: errorType, context });
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'erreur:', error);
    }
  }

  /**
   * Enregistrer un hit du cache
   */
  recordCacheHit() {
    try {
      this.cacheHits.inc();
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement du cache hit:', error);
    }
  }

  /**
   * Enregistrer un miss du cache
   */
  recordCacheMiss() {
    try {
      this.cacheMisses.inc();
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement du cache miss:', error);
    }
  }

  /**
   * Mettre à jour la taille du cache
   */
  updateCacheSize(size) {
    try {
      this.cacheSize.set(size);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la taille du cache:', error);
    }
  }

  /**
   * Mettre à jour le statut du stream
   */
  updateStreamStatus(isOnline) {
    try {
      this.streamStatus.set(isOnline ? 1 : 0);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut du stream:', error);
    }
  }

  /**
   * Obtenir toutes les métriques au format Prometheus
   */
  async getMetrics() {
    try {
      return await this.register.metrics();
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques:', error);
      return '';
    }
  }

  /**
   * Obtenir les métriques au format JSON
   */
  async getMetricsJson() {
    try {
      const metrics = await this.register.getMetricsAsJSON();
      return metrics;
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques JSON:', error);
      return [];
    }
  }
}

// Instance singleton
const metricsCollector = new MetricsCollector();

export default metricsCollector;
