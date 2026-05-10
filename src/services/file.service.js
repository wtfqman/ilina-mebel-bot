const fs = require('fs/promises');
const path = require('path');
const { Input } = require('telegraf');

const ASSETS_ROOT = path.resolve(__dirname, '../../assets');

function resolveAssetPath(...segments) {
  return path.join(ASSETS_ROOT, ...segments);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function sendDocumentIfExists(ctx, filePath, options = {}) {
  if (!filePath || !(await fileExists(filePath))) {
    return false;
  }

  await ctx.replyWithDocument(Input.fromLocalFile(filePath), options);
  return true;
}

async function sendDocumentByTelegramFileId(ctx, telegramFileId, options = {}) {
  if (!telegramFileId) {
    return false;
  }

  await ctx.replyWithDocument(telegramFileId, options);
  return true;
}

module.exports = {
  resolveAssetPath,
  fileExists,
  sendDocumentIfExists,
  sendDocumentByTelegramFileId,
};
