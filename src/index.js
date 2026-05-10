const { createBot, initializeBot } = require('./bot');
const { config, getConfigWarnings, validateEnv } = require('./config/env');
const { logger } = require('./config/logger');
const { logGoogleSheetsStartupStatus } = require('./services/googleSheetsService');

function registerProcessHandlers(bot) {
  const shutdown = async (signal) => {
    logger.warn(`Received ${signal}. Stopping bot...`);

    try {
      await bot.stop(signal);
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection.', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception.', error);
    process.exit(1);
  });
}

async function bootstrap() {
  validateEnv();
  logGoogleSheetsStartupStatus();

  const bot = createBot();

  await initializeBot(bot);
  await bot.launch();

  registerProcessHandlers(bot);

  logger.info(`Bot "${config.botName}" started in ${config.nodeEnv} mode.`);
  logger.info('Application is ready to receive Telegram updates.');

  getConfigWarnings().forEach((warning) => {
    logger.warn(warning.message, warning.details);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start the bot.', error);
  process.exit(1);
});
