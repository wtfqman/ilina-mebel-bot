function ensureUserContext(ctx) {
  ctx.session = ctx.session || {};
  ctx.session.userContext = ctx.session.userContext || {
    role: null,
  };

  return ctx.session.userContext;
}

function getUserRole(ctx) {
  return ensureUserContext(ctx).role;
}

function setUserRole(ctx, role) {
  const userContext = ensureUserContext(ctx);
  userContext.role = role;
  return userContext;
}

function clearUserRole(ctx) {
  const userContext = ensureUserContext(ctx);
  userContext.role = null;
  return userContext;
}

module.exports = {
  getUserRole,
  setUserRole,
  clearUserRole,
};
