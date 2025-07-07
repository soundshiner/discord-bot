# 📦 soundshine-bot

> Bot Discord modulaire pour webradio communautaire.

---

## 🧠 Stack

- **Runtime:** Node.js
- **Framework:** discord.js v14.21.0
- **DB:** better-sqlite3
- **Logger:** logger.js + secureLogger.js
- **Validation:** zod
- **Tests:** vitest, stress-test maison
- **DevOps:** docker, CI/CD, husky, eslint

---

## 🗂️ Fichiers critiques

- `index.js`
- `core/services/AppState.js`
- `core/utils/retry.js`
- `core/utils/secureLogger.js`
- `bot/events/interactionCreate.js`
- `core/utils/rateLimiter.js`
- `core/handlers/commandHandler.js`

---

## ⚙️ Architecture

- **Modèle:** modulaire
- **Entrée:** `index.js`
- **Handlers:** commands, events, tasks, services, api
- **API:** Express.js
- **Routes:** REST, secured middleware
- **AppState:** `core/services/AppState.js`

---

## 🌱 Variables d’environnement

- `.env`, `.env.dev`, `.env.prod`
- **Actuellement :** `undefined`

---

## 🧾 Arborescence (excluant: node_modules, .git, logs, coverage, .vscode, suggestions.sqlite, z_contexte.txt)

```
.env
.env.dev
.env.prod
[.github]
  [workflows]
    ci-cd.yml
.gitignore
[api]
  index.js
  [middlewares]
    cors.js
    helmet.js
    loggingAPI.js
    validation.js
  [routes]
    alerts.js
    health.js
    logs.js
    metrics.js
    playlist-update.js
  routes.js
[bot]
  client.js
  [commands]
    drink.js
    force.js
    getwallpaper.js
    nowplaying.js
    ping.js
    play.js
    schedule.js
    stats.js
    stop.js
    suggest-delete.js
    suggest-edit.js
    suggest-list.js
    suggest.js
  config.js
  [events]
    interactionCreate.js
  [handlers]
    handlePlaylistSelect.js
    loadCommands.js
    loadEvents.js
  logger.js
  startup.js
  [tasks]
    logMemory.js
    updateStatus.js
  [utils]
    alerts.js
    cache.js
    checkStreamOnline.js
    database.js
    genres.js
    globalConfig.js
    metrics.js
    socialChannel.js
    validateURL.js
    yoda-config.js
    yoda.js
    yodaify-reply.js
[config]
  .dockerignore
  .eslintrc.js
  .eslintrc.json
  .gitattributes
  .gitconfig
  eslint.config.js
  jest.config.js
  vitest.config.js
[core]
  lifecycle.js
  [middleware]
    security.js
  monitor.js
  [services]
    AppState.js
  [utils]
    rateLimiter.js
    retry.js
    secureLogger.js
    validation.js
[data]
  schedule.txt
  yodaConfig.json
[databases]
[docker]
  docker-compose.yml
  Dockerfile
[docs]
  ENVIRONMENT.md
  OPTIMIZATIONS.md
  PLAN_OPTIMISATION.md
  REFACTORING_SUMMARY.md
  SECURITY.md
  STRUCTURE.md
index.js
package-lock.json
package.json
README.md
[scripts]
  [bot]
    clear-commands.js
    deploy-commands.js
    fix-ephemeral.js
    start-bot.sh
    test-optimizations.js
  [dev]
    loggerMigrate.js
    pre-commit.js
    run-tests.js
    setup-user.sh
    test-optimizations.js
  [git]
    checkSecrets.js
    gh-issues.js
    git-actions.js
  [infra]
    deploy.sh
    security-check.js
    setup-security-aliases.sh
    soundshine-dev-env.bat
  README.md
  [tools]
    projectContext.js
    tree.js
[tests]
  config.test.js
  core.config.test.js
  errorHandler.test.js
  [integration]
    api.test.js
    commands.test.js
    events.test.js
    handlers.test.js
    tasks.test.js
    utils.test.js
  logger.test.js
  [mocks]
    express.mock.js
  [performance]
    load.test.js
  README.md
  security.test.js
  [stress]
    stress.test.js
  vitest.setup.js
[utils]
  cache.js
  database.js
```
