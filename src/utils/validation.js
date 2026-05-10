function sanitizeTextInput(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function isNonEmptyText(value) {
  return sanitizeTextInput(value).length > 0;
}

function normalizePhoneNumber(value) {
  return sanitizeTextInput(value);
}

function isValidPhoneNumber(value) {
  const normalizedPhone = normalizePhoneNumber(value);
  const digitsOnly = normalizedPhone.replace(/\D/g, '');
  const allowedPattern = /^[+\d\s()-]+$/;

  return (
    allowedPattern.test(normalizedPhone) &&
    digitsOnly.length >= 10 &&
    digitsOnly.length <= 15
  );
}

module.exports = {
  sanitizeTextInput,
  isNonEmptyText,
  normalizePhoneNumber,
  isValidPhoneNumber,
};
