const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller.js");
const {
  authenticateToken,
  requireAdmin,
} = require("../middlewares/auth.middleware.js");

router.delete("/:id", authenticateToken, commentController.delete);
router.post("/:id/article", authenticateToken, commentController.add);
router.get("/:id/article", commentController.getByArticle);
router.get("/", authenticateToken, requireAdmin, commentController.index);

module.exports = router;
