// utils/logger.js (ESM)
/* eslint-disable no-console */
import chalk from 'chalk';

const logger = {
  info: (msg, ...args) => console.log(chalk.blue('[INFO]'), msg, ...args),
  warn: (msg, ...args) => console.warn(chalk.yellow('[WARN]'), msg, ...args),
  error: (msg, ...args) => console.error(chalk.red('[ERROR]'), msg, ...args),
  debug: (msg, ...args) => console.debug(chalk.gray('[DEBUG]'), msg, ...args),
  success: (msg, ...args) =>
    console.log(chalk.green('[SUCCESS]'), msg, ...args),
  section: (title) => {
    console.log(chalk.cyan(`\n${  '━'.repeat(30)}`));
    console.log(chalk.cyan(` ${title}`));
    console.log(chalk.cyan('━'.repeat(30)));
  },
  custom: (label, msg, color = 'white') => {
    const colorFn
      = typeof chalk[color] === 'function' ? chalk[color] : chalk.white;
    console.log(colorFn(`[${label}]`), msg);
  }
};

export default logger;

