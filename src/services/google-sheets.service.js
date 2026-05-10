const googleSheetsService = require('./googleSheetsService');

module.exports = {
  ...googleSheetsService,
  appendCustomerRequestSubmission: googleSheetsService.appendCustomerRequest,
  appendConsultationSubmission: googleSheetsService.appendConsultation,
  appendDesignerSubmission: googleSheetsService.appendDesignerRegistration,
  appendDesignerProjectSubmission: googleSheetsService.appendDesignerProjectRequest,
};
