const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const settingsController = require("../controllers/settings.controller");

router.get("/providers", authMiddleware, settingsController.getProviderSettings);
router.put("/providers", authMiddleware, settingsController.saveProviderSettings);
router.post("/providers/test-voice", authMiddleware, settingsController.testVoiceCall);
router.post("/providers/test-sms", authMiddleware, settingsController.testSMS);

module.exports = router;
