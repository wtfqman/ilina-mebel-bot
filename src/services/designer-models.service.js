const { DESIGNER_ACTION_BUTTONS } = require('../constants/buttons');
const { DESIGNER_MODELS } = require('../config/designer-models');
const { SECTION_TEXTS } = require('../constants/section-texts');
const { buildCatalogKeyboard } = require('../keyboards/catalog.keyboard');
const { createSectionActionsKeyboard } = require('../keyboards/section-actions.keyboard');
const { resolveAssetPath, sendDocumentIfExists } = require('./file.service');

function getAllDesignerModels() {
  return [...DESIGNER_MODELS];
}

function getDesignerModelById(itemId) {
  return DESIGNER_MODELS.find((item) => item.id === itemId) || null;
}

function getDesignerModelsKeyboard() {
  return buildCatalogKeyboard(DESIGNER_MODELS, [DESIGNER_ACTION_BUTTONS.REQUEST_3D_MODEL]);
}

async function sendDesignerModelAsset(ctx, item) {
  const absolutePath = item.filePath ? resolveAssetPath('models', item.filePath) : '';
  const isSent = await sendDocumentIfExists(ctx, absolutePath, {
    caption: SECTION_TEXTS.modelFile(item.title),
  });

  if (!isSent || item.type === 'request') {
    return {
      text: SECTION_TEXTS.modelRequest(item.title),
      keyboard: createSectionActionsKeyboard([DESIGNER_ACTION_BUTTONS.REQUEST_3D_MODEL]),
    };
  }

  return {
    text: 'Можно запросить еще одну 3D модель или вернуться в меню.',
    keyboard: createSectionActionsKeyboard([DESIGNER_ACTION_BUTTONS.REQUEST_3D_MODEL]),
  };
}

module.exports = {
  getAllDesignerModels,
  getDesignerModelById,
  getDesignerModelsKeyboard,
  sendDesignerModelAsset,
};
