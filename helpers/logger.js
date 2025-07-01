/* eslint-disable no-console */
import chalk from 'chalk';

const sectionStart = (title) => {
  console.log(chalk.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan(`┃ ${title}`));
  console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
};

const summary = (text) => {
  console.log(chalk.bold.yellow(`\n📌 Résumé : ${text}`));
};

const custom = (prefix, message, color = 'blue') => {
  const colorFn = chalk[color] || chalk.white;
  console.log(colorFn(`[ ${prefix} ] ${message}`));
};

const consoleLogger = {
  sectionStart,
  summary,
  custom,
  success: (msg) => console.log(chalk.green(`[✔ SUCCÈS ] ${msg}`)),
  infocmd: (msg) => console.log(chalk.magenta(`[📡 CMD ] : ${msg}`)),
  warn: (msg) => console.warn(chalk.yellow(`[⚠ WARN ] ${msg}`)),
  error: (msg) => console.error(chalk.red(`[✖ ERROR ] ${msg}`))
};

export default consoleLogger;
