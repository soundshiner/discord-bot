import logger from "./logger.js";
import chalk from "chalk";

/**
 * A centralized error handling function.
 *
 * @param {Error} error The error object.
 * @param {string} context A string providing context about where the error occurred.
 * @param {boolean} isCritical If true, indicates the error might require application restart.
 */
function handleError(error, context, isCritical = false) {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - [${context.toUpperCase()}] ${
    error.stack || error.message
  }`;

  logger.error(errorMessage);

  console.error(chalk.red.bold("--- ERROR DETECTED ---"));
  console.error(chalk.red(`Context: ${context}`));
  console.error(chalk.red(`Message: ${error.message}`));
  if (error.stack) {
    console.error(chalk.gray(error.stack));
  }
  console.error(chalk.red.bold("--- END ERROR ---"));

  if (isCritical) {
    logger.fatal(
      `Critical error in ${context}, shutting down. Error: ${error.message}`
    );
    console.error(
      chalk.bgRed.white.bold(
        "CRITICAL ERROR! The application may be in an unstable state."
      )
    );
    // In a real scenario, you might want to gracefully shut down the application.
    // For now, we just log it as fatal.
    // process.exit(1);
  }
}

export { handleError };
