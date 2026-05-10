const { config } = require('./env');

function resolveConsoleMethod(level) {
  if (level === 'ERROR') {
    return console.error;
  }

  if (level === 'WARN') {
    return console.warn;
  }

  return console.log;
}

function writeLog(level, message, meta) {
  const timestamp = new Date().toISOString();
  const consoleMethod = resolveConsoleMethod(level);

  if (typeof meta === 'undefined') {
    consoleMethod(`[${timestamp}] [${level}] ${message}`);
    return;
  }

  consoleMethod(`[${timestamp}] [${level}] ${message}`, meta);
}

const logger = {
  debug(message, meta) {
    if (config.nodeEnv !== 'development') {
      return;
    }

    writeLog('DEBUG', message, meta);
  },

  info(message, meta) {
    writeLog('INFO', message, meta);
  },

  warn(message, meta) {
    writeLog('WARN', message, meta);
  },

  error(message, meta) {
    writeLog('ERROR', message, meta);
  },
};

module.exports = {
  logger,
};
