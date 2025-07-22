import chalk from "chalk";
import fs from "fs/promises";
import path from "path";

const LOG_CONFIG = {
  levels: ["error", "warn", "info", "debug"],
  file: {
    enabled: process.env.LOG_TO_FILE === "true",
    directory: "./logs",
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  },
  batch: {
    enabled: true,
    size: 10,
    timeout: 1000,
  },
};

const logBatch = [];
let batchTimeout = null;

const levelColors = {
  error: chalk.red("[ERROR]"),
  warn: chalk.yellow("[WARN]"),
  info: chalk.blue("[INFO]"),
  debug: chalk.gray("[DEBUG]"),
  success: chalk.green("[SUCCESS]"),
};

class Logger {
  constructor() {
    this.startTime = Date.now();
    this.initialize();
  }

  async initialize() {
    if (LOG_CONFIG.file.enabled) {
      await fs
        .mkdir(LOG_CONFIG.file.directory, { recursive: true })
        .catch(() => {});
    }
  }

  format(level, section = "", message = "") {
    const timestamp = chalk.dim(`[${new Date().toISOString()}]`);
    const tag = levelColors[level] || `[${level.toUpperCase()}]`;
    const sectionTag = section ? chalk.cyan(`${section}`) : "";
    return `${timestamp} ${tag} ${sectionTag} ${message}`;
  }

  async log(level, section, message) {
    const formatted = this.format(level, section, message);
    console.log(formatted);

    if (LOG_CONFIG.file.enabled) {
      if (LOG_CONFIG.batch.enabled) {
        this.queueLog(this.stripChalk(formatted));
      } else {
        await this.writeToFile(this.stripChalk(formatted));
      }
    }
  }

  stripChalk(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, "");
  }

  queueLog(line) {
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

  async flushBatch() {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    if (logBatch.length === 0) return;

    const content = logBatch.join("\n") + "\n";
    logBatch.length = 0;
    await this.writeToFile(content);
  }

  async writeToFile(content) {
    const filename = path.join(
      LOG_CONFIG.file.directory,
      this.getCurrentLogFile()
    );

    await fs.appendFile(filename, content).catch((err) => {
      console.error("Erreur écriture fichier log:", err);
    });

    const { size } = await fs.stat(filename);
    if (size > LOG_CONFIG.file.maxSize) {
      await this.rotateFile(filename);
    }
  }

  getCurrentLogFile() {
    return `bot-${new Date().toISOString().split("T")[0]}.log`;
  }

  async rotateFile(filepath) {
    const timestamp = Date.now();
    const rotated = filepath.replace(/\.log$/, `-${timestamp}.log`);

    await fs.rename(filepath, rotated).catch(() => {});
    await this.cleanOldLogs();
  }

  async cleanOldLogs() {
    const files = await fs.readdir(LOG_CONFIG.file.directory);
    const logs = files.filter((f) => f.endsWith(".log")).sort();

    if (logs.length > LOG_CONFIG.file.maxFiles) {
      const toDelete = logs.slice(0, logs.length - LOG_CONFIG.file.maxFiles);
      for (const file of toDelete) {
        await fs
          .unlink(path.join(LOG_CONFIG.file.directory, file))
          .catch(() => {});
      }
    }
  }

  // Public logging methods
  info = (section, msg) => this.log("info", section, msg);
  warn = (section, msg) => this.log("warn", section, msg);
  error = (section, msg) => this.log("error", section, msg);
  debug = (section, msg) => this.log("debug", section, msg);
  success = (section, msg) => this.log("success", section, msg);
  custom = (section, msg) => this.log("custom", section, msg);

  // Bannières & sections
  banner(title) {
    const line = "━".repeat(60);
    console.log(
      `\n${chalk.magentaBright(line)}\n${chalk.bold(title)}\n${chalk.magentaBright(line)}\n`
    );
  }

  section(title) {
    const line = "─".repeat(60);
    console.log(
      `\n${chalk.yellow(line)}\n${chalk.bold(`  ${title}  `)}\n${chalk.yellow(line)}\n`
    );
  }
}

const logger = new Logger();
await logger.initialize();

export default logger;

