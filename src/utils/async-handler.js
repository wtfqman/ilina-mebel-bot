const { handleBotError } = require('./error-handler');

function withErrorBoundary(handler) {
  return async (ctx, next) => {
    try {
      return await handler(ctx, next);
    } catch (error) {
      return handleBotError(error, ctx);
    }
  };
}

module.exports = {
  withErrorBoundary,
};
