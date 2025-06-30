# ================================
# Dockerfile multi-stage pour soundSHINE Bot
# Version sécurisée et optimisée
# ================================

# Stage 1: Builder
FROM node:20-alpine3.22 AS builder

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances avec audit de sécurité
RUN npm ci --only=production --audit=false && \
    npm audit fix --audit-level=moderate || true

# Copier le code source (exclure les fichiers sensibles)
COPY . .

# Stage 2: Production
FROM node:20-alpine3.22 AS production

# Installer ffmpeg pour le traitement audio
RUN apk add --no-cache \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Créer un utilisateur non-root avec des permissions minimales
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bot -u 1001 -G nodejs

WORKDIR /app

# Copier les fichiers de base
COPY --from=builder --chown=bot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bot:nodejs /app/index.js ./
COPY --from=builder --chown=bot:nodejs /app/package.json ./

# Copier les dossiers nécessaires
COPY --from=builder --chown=bot:nodejs /app/core ./core
COPY --from=builder --chown=bot:nodejs /app/commands ./commands
COPY --from=builder --chown=bot:nodejs /app/utils ./utils
COPY --from=builder --chown=bot:nodejs /app/api ./api
COPY --from=builder --chown=bot:nodejs /app/tasks ./tasks
COPY --from=builder --chown=bot:nodejs /app/handlers ./handlers
COPY --from=builder --chown=bot:nodejs /app/events ./events
COPY --from=builder --chown=bot:nodejs /app/data ./data

# Créer les dossiers nécessaires avec les bonnes permissions
RUN mkdir -p /app/logs /app/temp && \
    chown -R bot:nodejs /app/logs /app/temp

# Sécuriser les permissions
RUN chmod -R 755 /app && \
    chmod -R 777 /app/logs /app/temp

# Exposer le port
EXPOSE 3894

# Basculer vers l'utilisateur non-root
USER bot

# Variables d'environnement sécurisées
ENV NODE_ENV=production \
    PORT=3894 \
    NODE_OPTIONS="--max-old-space-size=512"

# Healthcheck amélioré
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3894/v1/health || exit 1

# Commande de démarrage
CMD ["node", "index.js"] 