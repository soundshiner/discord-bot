// ========================================
// bot/logger.js (ESM)
// ========================================

/* eslint-disable no-console */
import chalk from 'chalk';

const logger = {
  // Méthodes de base
  info: (msg, ...args) => console.log(chalk.blue('[INFO]'), msg, ...args),
  warn: (msg, ...args) => console.warn(chalk.yellow('[WARN]'), msg, ...args),
  error: (msg, ...args) => console.error(chalk.red('[ERROR]'), msg, ...args),
  debug: (msg, ...args) => console.debug(chalk.gray('[DEBUG]'), msg, ...args),
  success: (msg, ...args) =>
    console.log(chalk.green('[SUCCESS]'), msg, ...args),

  // Méthodes spécialisées
  infocmd: (msg) => console.log(chalk.magenta(`[📡 CMD] ${msg}`)),
  custom: (label, msg, color = 'white') => {
    const colorFn
      = typeof chalk[color] === 'function' ? chalk[color] : chalk.white;
    console.log(colorFn(`[${label}]`), msg);
  },

  // Sections et séparateurs
  section: (title) => {
    console.log(chalk.cyan(`\n${'━'.repeat(30)}`));
    console.log(chalk.cyan(` ${title}`));
    console.log(chalk.cyan('━'.repeat(30)));
  },

  sectionStart: (title) => {
    console.log(chalk.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan(`┃ ${title}`));
    console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  },

  summary: (text) => {
    console.log(chalk.bold.yellow(`\n📌 Résumé : ${text}`));
  },

  // Méthodes pour le bot
  bot: (msg) => console.log(chalk.cyan(`[🤖 BOT] ${msg}`)),
  command: (msg) => console.log(chalk.magenta(`[⚡ CMD] ${msg}`)),
  event: (msg) => console.log(chalk.blue(`[📡 EVT] ${msg}`)),
  task: (msg) => console.log(chalk.yellow(`[🔄 TASK] ${msg}`)),
  api: (msg) => console.log(chalk.green(`[🌐 API] ${msg}`))
};

export default logger;
