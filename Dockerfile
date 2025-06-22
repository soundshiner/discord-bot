# ========================================
# Dockerfile - soundSHINE Bot
# ========================================

# Étape 1: Build stage
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Étape 2: Production stage
FROM node:18-alpine AS production

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bot -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les dépendances depuis le builder
COPY --from=builder --chown=bot:nodejs /app/node_modules ./node_modules

# Copier le code source
COPY --chown=bot:nodejs . .

# Créer les répertoires nécessaires
RUN mkdir -p logs && \
    chown -R bot:nodejs logs

# Variables d'environnement
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Exposer le port
EXPOSE 3000

# Changer vers l'utilisateur non-root
USER bot

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Commande de démarrage
CMD ["node", "index.js"] 