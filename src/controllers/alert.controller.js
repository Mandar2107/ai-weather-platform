const alertService = require("../services/alert.service");

exports.sendAlert = async (req, res) => {
  try {
    const result = await alertService.processAlert(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.previewAlert = async (req, res) => {
  try {
    const result = await alertService.previewAlert(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLanguagePreview = async (req, res) => {
  try {
    const result = await alertService.getLanguagePreview(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await alertService.getAlerts(req.query);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
