const { Scenes } = require('telegraf');

const { consultationFormScene } = require('./consultation-form.scene');
const { designerFormScene } = require('./designer-form.scene');
const { designerProjectFormScene } = require('./designer-project-form.scene');
const { requestFormScene } = require('./request-form.scene');

function createStage() {
  return new Scenes.Stage([
    requestFormScene,
    consultationFormScene,
    designerFormScene,
    designerProjectFormScene,
  ]);
}

module.exports = {
  createStage,
};
