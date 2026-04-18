const farmerService = require("../services/farmer.service");

exports.addFarmer = async (req, res) => {
  try {
    const farmer = await farmerService.createFarmer(req.body);
    res.status(201).json(farmer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getFarmers = async (req, res) => {
  try {
    const farmers = await farmerService.getFarmers(req.query);
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFarmerSummary = async (req, res) => {
  try {
    const summary = await farmerService.getFarmerSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.importFarmers = async (req, res) => {
  try {
    const farmers = await farmerService.importFarmers(req.body.rows);
    res.status(201).json({
      message: `${farmers.length} farmers imported`,
      count: farmers.length
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFarmer = async (req, res) => {
  try {
    await farmerService.deleteFarmer(req.params.id);
    res.json({ message: "Farmer deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
