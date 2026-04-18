const settingsService = require("../services/settings.service");
const notificationService = require("../services/notification.service");

exports.getProviderSettings = async (req, res) => {
  res.json(settingsService.getProviderSettings());
};

exports.saveProviderSettings = async (req, res) => {
  try {
    const settings = settingsService.saveProviderSettings(req.body);
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.testVoiceCall = async (req, res) => {
  try {
    const result = await notificationService.testVoiceCall(req.body.phone, req.body.message);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.testSMS = async (req, res) => {
  try {
    const result = await notificationService.testSMS(req.body.phone, req.body.message);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
