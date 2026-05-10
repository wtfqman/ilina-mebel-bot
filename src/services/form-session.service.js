function createFormSessionService(sessionKey, createEmptyForm) {
  function initializeForm(ctx) {
    ctx.session[sessionKey] = createEmptyForm();
    return ctx.session[sessionKey];
  }

  function getForm(ctx) {
    if (!ctx.session[sessionKey]) {
      return initializeForm(ctx);
    }

    return ctx.session[sessionKey];
  }

  function updateFormField(ctx, field, value) {
    const form = getForm(ctx);
    form[field] = value;
    return form;
  }

  function clearForm(ctx) {
    if (ctx?.session?.[sessionKey]) {
      delete ctx.session[sessionKey];
    }
  }

  function isSubmissionInProgress(ctx) {
    return Boolean(getForm(ctx).isSubmitting);
  }

  function setSubmissionInProgress(ctx, isSubmitting) {
    const form = getForm(ctx);
    form.isSubmitting = isSubmitting;
    return form;
  }

  return {
    initializeForm,
    getForm,
    updateFormField,
    clearForm,
    isSubmissionInProgress,
    setSubmissionInProgress,
  };
}

module.exports = {
  createFormSessionService,
};
