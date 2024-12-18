const express = require("express");
const router = express.Router();
const followerController = require("../controllers/follower.controller.js");
const { authenticateToken } = require("../middlewares/auth.middleware.js");

router.post("/:id", authenticateToken, followerController.add);
router.get("/:id", authenticateToken, followerController.show);

router.get(
  "/:id/listFollowerAndFollowing",
  authenticateToken,
  followerController.list,
);

module.exports = router;
