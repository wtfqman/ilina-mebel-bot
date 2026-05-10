const {
  CATALOG_NAVIGATION_BUTTONS,
  COMMON_BUTTONS,
  CUSTOMER_MENU_BUTTONS,
  DESIGNER_ACTION_BUTTONS,
  DESIGNER_MENU_BUTTONS,
} = require('../constants/buttons');
const { withErrorBoundary } = require('../utils/async-handler');
const { handleBackToMenu } = require('./back-to-menu.handler');
const { handleCatalog, handleCatalogBack, handleCatalogTextSelection } = require('./catalog.handler');
const { handleConsultation } = require('./consultation.handler');
const { handleDesignerCooperation, handleDesignerProfileForm } = require('./designer-cooperation.handler');
const { handleDesignerProjectRequest } = require('./designer-project-request.handler');
const { handleFaq } = require('./faq.handler');
const { handleLocation } = require('./location.handler');
const { handleManagers } = require('./managers.handler');
const { handlePrice } = require('./price.handler');
const { handleRequest } = require('./request.handler');
const {
  createDesignerModelItemHandler,
  handleThreeDModels,
} = require('./three-d-models.handler');
const { getAllDesignerModels } = require('../services/designer-models.service');

function registerRouteGroup(bot, routes) {
  routes.forEach(({ button, handler }) => {
    bot.hears(button, withErrorBoundary(handler));
  });
}

function registerMenuHandlers(bot) {
  registerRouteGroup(bot, [
    { button: CUSTOMER_MENU_BUTTONS.FAQ, handler: handleFaq },
    { button: CUSTOMER_MENU_BUTTONS.CATALOGS, handler: handleCatalog },
    { button: CUSTOMER_MENU_BUTTONS.PRICE, handler: handlePrice },
    { button: CUSTOMER_MENU_BUTTONS.LOCATION, handler: handleLocation },
    { button: CUSTOMER_MENU_BUTTONS.MANAGERS, handler: handleManagers },
    { button: CUSTOMER_MENU_BUTTONS.REQUEST, handler: handleRequest },
    { button: CUSTOMER_MENU_BUTTONS.CONSULTATION, handler: handleConsultation },
  ]);

  registerRouteGroup(bot, [
    { button: DESIGNER_MENU_BUTTONS.CATALOGS, handler: handleCatalog },
    { button: DESIGNER_MENU_BUTTONS.MODELS_3D, handler: handleThreeDModels },
    { button: DESIGNER_MENU_BUTTONS.COOPERATION, handler: handleDesignerCooperation },
    { button: DESIGNER_MENU_BUTTONS.PROJECT_REQUEST, handler: handleDesignerProjectRequest },
    { button: DESIGNER_MENU_BUTTONS.CONSULTATION, handler: handleConsultation },
    { button: DESIGNER_MENU_BUTTONS.LOCATION, handler: handleLocation },
  ]);

  registerRouteGroup(bot, [
    {
      button: DESIGNER_ACTION_BUTTONS.START_COOPERATION_FORM,
      handler: handleDesignerProfileForm,
    },
    {
      button: DESIGNER_ACTION_BUTTONS.REQUEST_3D_MODEL,
      handler: handleDesignerProjectRequest,
    },
  ]);

  registerRouteGroup(
    bot,
    getAllDesignerModels().map((item) => ({
      button: item.title,
      handler: createDesignerModelItemHandler(item.id),
    })),
  );

  bot.hears(COMMON_BUTTONS.BACK_TO_MENU, withErrorBoundary(handleBackToMenu));
  bot.hears(CATALOG_NAVIGATION_BUTTONS.BACK, withErrorBoundary(handleCatalogBack));
  bot.hears(CATALOG_NAVIGATION_BUTTONS.CATALOG, withErrorBoundary(handleCatalog));
  bot.hears(CATALOG_NAVIGATION_BUTTONS.MENU, withErrorBoundary(handleBackToMenu));
  bot.on('text', withErrorBoundary(handleCatalogTextSelection));
}

module.exports = {
  registerMenuHandlers,
};
