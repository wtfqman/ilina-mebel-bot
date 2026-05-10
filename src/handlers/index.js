const { registerCatalogAdminHandlers } = require('./catalog-admin.handler');
const { registerFileInfoHandler } = require('./file-info.handler');
const { registerMenuHandlers } = require('./menu.handler');
const { registerRoleHandlers } = require('./role.handler');
const { registerStartHandler } = require('./start.handler');
const { registerUnknownHandler } = require('./unknown.handler');

function registerPreSceneHandlers(bot) {
  registerFileInfoHandler(bot);
}

function registerHandlers(bot) {
  registerStartHandler(bot);
  registerRoleHandlers(bot);
  registerCatalogAdminHandlers(bot);
  registerMenuHandlers(bot);
  registerUnknownHandler(bot);
}

module.exports = {
  registerPreSceneHandlers,
  registerHandlers,
};
