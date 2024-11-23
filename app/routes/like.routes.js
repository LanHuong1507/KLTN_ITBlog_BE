const express = require("express");
const router = express.Router();
const likeController = require("../controllers/like.controller.js");
const { authenticateToken } = require("../middlewares/auth.middleware.js");

router.post("/:id/article", authenticateToken, likeController.add);
router.get("/:id/article", likeController.getByArticle);
router.get("/:id/liked", authenticateToken, likeController.checkUserLiked);

module.exports = router;
