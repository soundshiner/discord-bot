# ========================================
# Dockerfile multi-stage pour soundSHINE Bot
# ========================================

# Stage 1: Build
FROM node:18-alpine AS builder

# Installer les dépendances de build
RUN apk add --no-cache python3 make g++

# Créer l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bot -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production
FROM node:18-alpine AS production

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    && rm -rf /var/cache/apk/*

# Créer l'utilisateur non-root (même UID/GID que le builder)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bot -u 1001

# Créer les répertoires nécessaires
RUN mkdir -p /app/logs /app/data && \
    chown -R bot:nodejs /app

# Définir le répertoire de travail
WORKDIR /app

# Copier les dépendances du stage builder
COPY --from=builder --chown=bot:nodejs /app/node_modules ./node_modules

# Copier le code source
COPY --chown=bot:nodejs . .

# Créer le fichier de configuration par défaut
RUN echo '{"NODE_ENV": "production"}' > /app/config.json

# Exposer le port de l'API
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Basculer vers l'utilisateur non-root
USER bot

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Commande de démarrage
CMD ["node", "index.js"] 