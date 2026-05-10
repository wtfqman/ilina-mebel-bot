const USER_ROLES = Object.freeze({
  CUSTOMER: 'customer',
  DESIGNER: 'designer',
});

const USER_ROLE_LABELS = Object.freeze({
  [USER_ROLES.CUSTOMER]: 'заказчик',
  [USER_ROLES.DESIGNER]: 'дизайнер',
});

module.exports = {
  USER_ROLES,
  USER_ROLE_LABELS,
};
