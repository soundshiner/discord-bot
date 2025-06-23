/* eslint-disable no-console */
// ========================================
// utils/logger.js
// ========================================
import winston from 'winston';
import chalk from 'chalk';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.printf(({ level, message }) => {
    return `[${level.toUpperCase()}] : ${message}`;
  }),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/bot.log' })]
});

// Custom additions
logger.success = msg => console.log(chalk.green(`[✔] ${msg}`));
logger.infocmd = msg => console.log(chalk.magenta(`[CMD] : ${msg}`));
logger.warn = msg => console.log(chalk.yellow(`[⚠] ${msg}`));
logger.error = msg => console.error(chalk.red(`[✖] ${msg}`));
logger.custom = (prefix, msg, color = 'blue') => {
  const colorFn = chalk[color] || chalk.white;
  console.log(colorFn(`[${prefix}] ${msg}`));
};

logger.section = sectionName => {
  console.log('');
  console.log(chalk.gray('══════════════════════════════════════════════════'));
  console.log(chalk.gray(`Chargement de la section : ${sectionName}`));
  console.log(chalk.gray('══════════════════════════════════════════════════'));
};

logger.sectionStart = sectionName => {
  console.log('');
  console.log(chalk.gray('══════════════════════════════════════════════════'));
  console.log(chalk.gray(`${sectionName}`));
  console.log(chalk.gray('══════════════════════════════════════════════════'));
};

// Export both default and named
export { logger };
export default logger;
