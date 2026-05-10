const { session, Telegraf } = require('telegraf');

const { config } = require('./config/env');
const { logger } = require('./config/logger');
const { COMMANDS } = require('./constants/commands');
const { registerHandlers, registerPreSceneHandlers } = require('./handlers');
const { createStage } = require('./scenes');
const { initializeCatalogStorage } = require('./services/catalogStorageService');
const { handleBotError } = require('./utils/error-handler');

function createBot() {
  const bot = new Telegraf(config.botToken);
  const stage = createStage();

  registerPreSceneHandlers(bot);

  if (stage) {
    bot.use(session());
    bot.use(stage.middleware());
    logger.info('Scenes middleware connected.');
  }

  registerHandlers(bot);

  bot.catch(async (error, ctx) => {
    await handleBotError(error, ctx);
  });

  return bot;
}

async function initializeBot(bot) {
  await initializeCatalogStorage();
  await bot.telegram.setMyCommands(COMMANDS);
  logger.info('Telegram commands registered.');
}

module.exports = {
  createBot,
  initializeBot,
};
