// ========================================
// bot/logger.js - Logger simplifié, performant et lisible
// ========================================

import chalk from 'chalk';

const LEVELS = {
  TRACE: { label: 'TRACE',   color: chalk.gray },
  DEBUG: { label: 'DEBUG',   color: chalk.magenta },
  INFO: { label: 'INFO',    color: chalk.cyan },
  WARN: { label: 'WARN',    color: chalk.yellowBright },
  ERROR: { label: 'ERROR',   color: chalk.redBright.bold },
  SUCCESS: { label: '✓ OK',    color: chalk.greenBright },

  CMD: { label: 'CMD',     color: chalk.blueBright },
  EVENT: { label: 'EVT',     color: chalk.magentaBright },
  API: { label: 'API',     color: chalk.cyanBright },
  BOT: { label: 'BOT',     color: chalk.greenBright },
  TASK: { label: 'TASK',    color: chalk.yellowBright },
  INIT: { label: 'INIT',    color: chalk.hex('#FFA500') },
  UPDATE: { label: 'UPD',     color: chalk.white }
};

class Logger {
  constructor () {
    this.metrics = {
      totalLogs: 0,
      logsByLevel: {},
      performance: {
        totalWriteTime: 0,
        writeCount: 0,
        avgWriteTime: 0
      }
    };
  }

  formatArg (arg) {
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number') return String(arg);
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return '[Unstringifiable]';
    }
  }

  log (level, ...args) {
    const start = performance.now();
    const timestamp = new Date().toISOString();
    const levelInfo = LEVELS[level] || LEVELS.INFO;

    const message = args.map(this.formatArg).join(' ');
    const line = `${chalk.gray(`[${timestamp}]`)} ${levelInfo.color(`[${levelInfo.label}]`)} ${message}`;

    process.stdout.write(`${line  }\n`);

    this._track(level, performance.now() - start);
  }

  _track (level, duration) {
    this.metrics.totalLogs++;
    this.metrics.logsByLevel[level] = (this.metrics.logsByLevel[level] || 0) + 1;
    this.metrics.performance.writeCount++;
    this.metrics.performance.totalWriteTime += duration;
    this.metrics.performance.avgWriteTime
      = this.metrics.performance.totalWriteTime / this.metrics.performance.writeCount;
  }

  getMetrics () {
    return this.metrics;
  }

  // Niveaux classiques
  trace   = (...args) => this.log('TRACE', ...args);
  debug   = (...args) => this.log('DEBUG', ...args);
  info    = (...args) => this.log('INFO', ...args);
  warn    = (...args) => this.log('WARN', ...args);
  error   = (...args) => this.log('ERROR', ...args);
  success = (...args) => this.log('SUCCESS', ...args);

  // Alias personnalisés
  custom  = (level, ...args) => this.log(level, ...args);
  command = (...args) => this.custom('CMD', ...args);
  event   = (...args) => this.custom('EVENT', ...args);
  api     = (...args) => this.custom('API', ...args);
  bot     = (...args) => this.custom('BOT', ...args);
  task    = (...args) => this.custom('TASK', ...args);
  init    = (...args) => this.custom('INIT', ...args);
  update  = (...args) => this.custom('UPDATE', ...args);

  // Perf simplifiée
  perf (operation, ms, success = true) {
    const status = success ? '✓' : '✗';
    this.info(`[PERF] ${status} ${operation} - ${ms.toFixed(2)}ms`);
  }

  // Mise en forme terminal
  banner (title) {
    const line = '━'.repeat(60);
    process.stdout.write(`\n${chalk.magenta(line)}\n${chalk.bold(`  ${title}  `)}\n${chalk.magenta(line)}\n\n`);
  }

  section (title) {
    const line = '━'.repeat(60);
    process.stdout.write(`\n${chalk.yellow(line)}\n${chalk.bold(`  ${title}  `)}\n${chalk.yellow(line)}\n\n`);
  }

  sectionStart (title) {
    const line = '━'.repeat(57);
    process.stdout.write(`\n${chalk.cyan(line)}\n${chalk.bold(`  ${title}  `)}\n${chalk.cyan(line)}\n`);
  }

  summary (title) {
    const line = `┗${'━'.repeat(57)}`;
    process.stdout.write(`\n${chalk.green(line)}\n${chalk.bold(`  ${title}  `)}\n${chalk.green(line)}\n`);
  }

  // Fallback sync
  errorSync (msg) {
    process.stdout.write(`[ERROR] ${msg}\n`);
  }

  warnSync (msg) {
    process.stdout.write(`[WARN] ${msg}\n`);
  }

  infoSync (msg) {
    process.stdout.write(`[INFO] ${msg}\n`);
  }
}

export default new Logger();
