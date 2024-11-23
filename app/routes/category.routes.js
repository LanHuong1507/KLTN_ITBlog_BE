const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller.js");
const {
  authenticateToken,
  requireAdmin,
} = require("../middlewares/auth.middleware.js");
const upload = require("../middlewares/upload.middleware.js")(
  "uploads/categories",
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  categoryController.delete,
);
router.get("/:idOrSlug", categoryController.show);
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  (req, res, next) => {
    upload.single("image_url")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message }); // Xử lý lỗi từ multer (ví dụ định dạng file sai)
      }
      next();
    });
  },
  categoryController.update,
);
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  (req, res, next) => {
    upload.single("image_url")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message }); // Xử lý lỗi từ multer (ví dụ định dạng file sai)
      }
      next();
    });
  },
  categoryController.add,
);
router.get("/", categoryController.index);

module.exports = router;
