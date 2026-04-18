const express = require("express");
const router = express.Router();

const farmerController = require("../controllers/farmer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/summary", authMiddleware, farmerController.getFarmerSummary);
router.post("/import", authMiddleware, farmerController.importFarmers);
router.post("/", authMiddleware, farmerController.addFarmer);
router.get("/", authMiddleware, farmerController.getFarmers);
router.delete("/:id", authMiddleware, farmerController.deleteFarmer);

module.exports = router;
