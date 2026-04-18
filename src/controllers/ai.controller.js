const aiService = require("../services/ai.service");

exports.getRisk = async (req, res) => {
  try {
    const { region } = req.body;

    if (!region) {
      return res.status(400).json({ message: "Region is required" });
    }

    const result = await aiService.analyzeRisk(region);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
