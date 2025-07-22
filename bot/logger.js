import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import stripAnsi from 'strip-ansi';
const LOG_CONFIG = {
  levels: ['error', 'warn', 'info', 'debug', 'trace', 'success'],
  file: {
    get enabled () {
      return process.env.LOG_TO_FILE === 'true';
    },
    directory: './logs',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  },
  batch: {
    enabled: true,
    size: 10,
    timeout: 1000
  }
};

const logBatch = [];
let batchTimeout = null;

const levelColors = {
  error: chalk.red('[ERROR]'),
  warn: chalk.yellow('[WARN]'),
  info: chalk.blue('[INFO]'),
  debug: chalk.gray('[DEBUG]'),
  trace: chalk.magenta('[TRACE]'),
  success: chalk.green('[INFO]')
};

class Logger {
  constructor () {
    this.startTime = Date.now();
    this.metrics = {
      totalLogs: 0,
      logsByLevel: {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
        trace: 0,
        success: 0
      },
      performance: {
        avgWriteTime: 0,
        totalWriteTime: 0,
        writeCount: 0
      }
    };
    this.initialize();
  }

  async initialize () {
    if (LOG_CONFIG.file.enabled) {
      await fs
        .mkdir(LOG_CONFIG.file.directory, { recursive: true })
        .catch(() => {});
    }
  }

  format (level, section = '', message = '') {
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        section,
        message
      });
    }
    const timestamp = chalk.dim(`[${new Date().toISOString()}]`);
    const tag = levelColors[level] || `[${level.toUpperCase()}]`;
    const sectionTag = section ? chalk.cyan(`${section}`) : '';
    return `${timestamp} ${tag} ${sectionTag} ${message}`;
  }

  async log (level, section, ...messages) {
    const msg = messages
      .map((m) => (typeof m === 'object' && m !== null ? JSON.stringify(m) : m))
      .join(' ');
    const formatted = this.format(level, section, msg);
    process.stdout.write(`${formatted}\n`);

    // Metrics
    this.metrics.totalLogs++;
    if (this.metrics.logsByLevel[level] !== undefined) {
      this.metrics.logsByLevel[level]++;
    }

    // File logging
    if (LOG_CONFIG.file.enabled) {
      if (LOG_CONFIG.batch.enabled) {
        this.queueLog(this.stripChalk(formatted));
      } else {
        await this.writeToFile(this.stripChalk(formatted));
      }
    }
  }

  stripChalk (str) {
    return stripAnsi(str);
  }

  queueLog (line) {
    logBatch.push(line);
    if (logBatch.length >= LOG_CONFIG.batch.size) {
      this.flushBatch();
    } else if (!batchTimeout) {
      batchTimeout = setTimeout(
        () => this.flushBatch(),
        LOG_CONFIG.batch.timeout
      );
    }
  }

  async flushBatch () {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    if (logBatch.length === 0) return;

    const content = `${logBatch.join('\n')}\n`;
    logBatch.length = 0;
    await this.writeToFile(content);
  }

  async writeToFile (content) {
    const filename = path.join(
      LOG_CONFIG.file.directory,
      this.getCurrentLogFile()
    );

    const start = Date.now();
    await fs.appendFile(filename, content).catch((err) => {
      process.stdout.write(`[ERROR] Erreur écriture fichier log: ${err}\n`);
    });
    const end = Date.now();

    // Metrics
    const duration = end - start;
    this.metrics.performance.totalWriteTime += duration;
    this.metrics.performance.writeCount++;
    this.metrics.performance.avgWriteTime
      = this.metrics.performance.totalWriteTime
      / this.metrics.performance.writeCount;

    const { size } = await fs.stat(filename);
    if (size > LOG_CONFIG.file.maxSize) {
      await this.rotateFile(filename);
    }
  }

  getCurrentLogFile () {
    return `bot-${new Date().toISOString().split('T')[0]}.log`;
  }

  async rotateFile (filepath) {
    const timestamp = Date.now();
    const rotated = filepath.replace(/\.log$/, `-${timestamp}.log`);

    await fs.rename(filepath, rotated).catch(() => {});
    await this.cleanOldLogs();
  }

  async cleanOldLogs () {
    const files = await fs.readdir(LOG_CONFIG.file.directory);
    const logs = files.filter((f) => f.endsWith('.log')).sort();

    if (logs.length > LOG_CONFIG.file.maxFiles) {
      const toDelete = logs.slice(0, logs.length - LOG_CONFIG.file.maxFiles);
      for (const file of toDelete) {
        await fs
          .unlink(path.join(LOG_CONFIG.file.directory, file))
          .catch(() => {});
      }
    }
  }

  // Public logging methods (compatibles avec les tests)
  info = async (...args) => this.log('info', '', ...args);
  warn = async (...args) => this.log('warn', '', ...args);
  error = async (...args) => this.log('error', '', ...args);
  debug = async (...args) => this.log('debug', '', ...args);
  trace = async (...args) => this.log('trace', '', ...args);
  success = async (...args) => this.log('success', '', `✅ ${args.join(' ')}`);
  custom = async (label, ...args) =>
    this.log('info', '', `[${label}] ${args.join(' ')}`);

  // Section, sectionStart, summary
  section = async (title) => {
    const line = '━'.repeat(60);
    process.stdout.write(
      `\n${chalk.yellow(line)}\n${chalk.bold(`  ${title}  `)}\n${chalk.yellow(line)}\n`
    );
  };

  sectionStart = async (title) => {
    const line = `┏${'━'.repeat(57)}`;
    process.stdout.write(
      `\n${chalk.cyan(line)}\n${chalk.bold(`  ${title}  `)}\n${chalk.cyan(line)}\n`
    );
  };

  summary = async (...args) => this.info(...args);

  // Métriques
  getMetrics = () => this.metrics;

  // Méthodes synchrones
  errorSync = (...args) => process.stdout.write(`[ERROR] ${args.join(' ')}\n`);
  warnSync = (...args) => process.stdout.write(`[WARN] ${args.join(' ')}\n`);
  infoSync = (...args) => process.stdout.write(`[INFO] ${args.join(' ')}\n`);

  // Méthodes de compatibilité
  infocmd = async (...args) => this.info(...args);
  bot = async (...args) => this.info('BOT', ...args);
  command = async (...args) => this.info('COMMAND', ...args);
  event = async (...args) => this.info('EVENT', ...args);
  task = async (...args) => this.info('TASK', ...args);
  api = async (...args) => this.info('API', ...args);

  // Bannières
  banner (title) {
    const line = '━'.repeat(60);
    process.stdout.write(
      `\n${chalk.magentaBright(line)}\n${chalk.bold(title)}\n${chalk.magentaBright(line)}\n`
    );
  }
}

const logger = new Logger();
await logger.initialize();

export default logger;

