const express = require("express");
const router = express.Router();

const alertController = require("../controllers/alert.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, alertController.getAlerts);
router.post("/language-preview", authMiddleware, alertController.getLanguagePreview);
router.post("/preview", authMiddleware, alertController.previewAlert);
router.post("/send", authMiddleware, alertController.sendAlert);

module.exports = router;
