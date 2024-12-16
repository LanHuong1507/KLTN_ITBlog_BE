const express = require("express");
const router = express.Router();
const articleController = require("../controllers/article.controller.js");
const {
  authenticateToken,
  requireAdmin,
  authenticateTokenNotRequired,
} = require("../middlewares/auth.middleware.js");
const upload = require("../middlewares/upload.middleware.js")(
  "uploads/articles",
);

router.delete("/:id", authenticateToken, articleController.delete);
router.get("/:idOrSlug", authenticateTokenNotRequired, articleController.show);
router.put(
  "/:id",
  authenticateToken,
  (req, res, next) => {
    upload.single("image_url")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message }); // Xử lý lỗi từ multer (ví dụ định dạng file sai)
      }
      next();
    });
  },
  articleController.update,
);
router.put(
  "/:id/draft",
  authenticateToken,
  upload.single("image_url"),
  articleController.draft,
);
router.patch(
  "/:id/public",
  authenticateToken,
  requireAdmin,
  articleController.public,
);
router.post(
  "/uploadImage",
  upload.single("upload"),
  articleController.uploadImage,
);
router.post(
  "/",
  authenticateToken,
  (req, res, next) => {
    upload.single("image_url")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message }); // Xử lý lỗi từ multer (ví dụ định dạng file sai)
      }
      next();
    });
  },
  articleController.add,
);
router.get("/:id/detail", authenticateToken, articleController.detail);
router.get("/", authenticateToken, articleController.index);

router.patch(
  "/:id/reject",
  authenticateToken,
  requireAdmin,
  articleController.reject,
);
router.get("/list/rejected", authenticateToken, articleController.listRejected);
router.get(
  "/list/rejected/:id",
  authenticateToken,
  articleController.detailRejected,
);

module.exports = router;
