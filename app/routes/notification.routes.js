const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller.js");
const { authenticateToken } = require("../middlewares/auth.middleware.js");

router.get("/", authenticateToken, notificationController.index);

router.delete(
  "/:id",
  authenticateToken,
  notificationController.deleteNotificationById,
);
router.delete(
  "/",
  authenticateToken,
  notificationController.deleteAllNotificationsByUser,
);
module.exports = router;
