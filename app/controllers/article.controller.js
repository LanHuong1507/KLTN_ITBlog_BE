const Article = require("../models/article.model.js");
const ArticleView = require("../models/article_view.model.js");
const User = require("../models/user.model.js");
const Comment = require("../models/comment.model.js");
const Notification = require("../models/notification.model.js");
const ArticleCategory = require("../models/article_category.model.js");
const Category = require("../models/category.model.js");
const { Op, where } = require("sequelize");
const path = require("path");
const fs = require("fs");

class ArticleController {
  // [GET] /articles?search=term&page=1&limit=10
  async index(req, res) {
    const { search, page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;
    const { role, userId } = req.user; // Lấy role và userId từ req.user

    try {
      let whereClause = search ? { title: { [Op.like]: `%${search}%` } } : {};

      // Nếu role là "user", thêm điều kiện chỉ lấy các bài viết của user đó
      if (role === "user") {
        whereClause = {
          ...whereClause,
          user_id: userId, // Chỉ lấy các bài viết của user hiện tại
        };
      } else {
        whereClause = {
          ...whereClause,
          [Op.or]: [
            { is_draft: false }, // Bài viết không phải là bản nháp
            { user_id: userId }, // Bài nháp của user hiện tại
          ],
        };
        if (search) {
          whereClause = {
            [Op.or]: [
              { title: { [Op.like]: `%${search}%` } },
            ],
          };
        }
      }
      const { rows, count } = await Article.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["article_id", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username"],
          },
          {
            model: ArticleView,
            as: "views",
            attributes: ["view_count"],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);
      res.status(200).json({
        totalArticles: count,
        currentPage: parseInt(page),
        totalPages,
        articles: rows,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi truy vấn bài viết", error });
    }
  }

  // [GET] /articles/list
  async list(req, res) {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
      let whereClause = search ? { title: { [Op.like]: `%${search}%` } } : {};

      whereClause = {
        ...whereClause,
        privacy: "public", // Chỉ lấy các bài viết được duyệt
      };
      const { rows, count } = await Article.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["article_id", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);
      res.status(200).json({
        totalArticles: count,
        currentPage: parseInt(page),
        totalPages,
        articles: rows,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi truy vấn bài viết", error });
    }
  }

  // [GET] /articles/:id
  async show(req, res) {
    try {
      const { idOrSlug } = req.params;
      // Tìm bài viết dựa trên article_id hoặc slug
      const article = await Article.findOne({
        where: {
          [Op.or]: [{ article_id: idOrSlug }, { slug: idOrSlug }],
          privacy: "public",
          is_draft: false,
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username", "fullname"], // Chỉ lấy các trường cần thiết
          },
        ],
      });

      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      // Tăng lượt xem
      const [articleView, created] = await ArticleView.findOrCreate({
        where: { article_id: article.article_id },
        defaults: { view_count: 1 }, // Nếu bài viết chưa có lượt xem, tạo mới với view_count = 1
      });

      if (!created) {
        articleView.view_count += 1;
        await articleView.save(); // Lưu lại số lượt xem mới
      }

      const listCategories = await ArticleCategory.findAll({
        where: {
          article_id: article.article_id,
        },
        attributes: ["category_id"],
      });

      let categories = [];
      for (let category of listCategories) {
        const categoryDetail = await Category.findOne({
          where: { category_id: category.category_id },
          attributes: ["category_id", "name", "slug"], // Chỉ lấy category_id và name
        });
        if (categoryDetail) {
          categories.push(categoryDetail);
        }
      }

      // Trả về thông tin bài viết và số lượt xem
      res.status(200).json({
        article,
        view_count: articleView.view_count,
        categories,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy bài viết", error });
    }
  }

  // [GET] /articles/:id/detail
  async detail(req, res) {
    const { id } = req.params;
    const { role, userId } = req.user;

    try {
      // Tìm bài viết dựa trên article_id
      const article = await Article.findOne({
        where: {
          article_id: id,
        },
      });

      if (role !== "admin" && userId != article.user_id)
        return res
          .status(400)
          .json({ message: "Bạn không có quyền thực hiện!" });

      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      const listCategories = await ArticleCategory.findAll({
        where: {
          article_id: id,
        },
        attributes: ["category_id"],
      });

      let categories = [];
      for (let category of listCategories) {
        const categoryDetail = await Category.findOne({
          where: { category_id: category.category_id },
          attributes: ["category_id", "name", "slug"], // Chỉ lấy category_id và name
        });
        if (categoryDetail) {
          categories.push(categoryDetail);
        }
      }

      // Trả về thông tin bài viết và số lượt xem
      return res.status(200).json({
        article,
        categories,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy bài viết", error });
    }
  }

  // [POST] /articles
  async add(req, res) {
    try {
      const {
        user_id = req.user.userId,
        title,
        content,
        tags,
        is_draft,
        slug,
        categories,
      } = req.body;
      let image_url = req.file;
      if (!title || !content || !slug) {
        return res
          .status(400)
          .json({
            message: "Các trường tiêu đề, nội dung, và đường dẫn là bắt buộc",
          });
      }
      const existingArticle = await Article.findOne({ where: { slug } });
      if (existingArticle) {
        return res.status(400).json({ message: "Đường dẫn đã tồn tại" });
      }

      if (!image_url)
        return res
          .status(400)
          .json({ message: "Vui lòng chọn ảnh đại diện cho bài viết" });
      const selectedCategories = JSON.parse(categories);

      if (!selectedCategories || selectedCategories.length <= 0)
        return res
          .status(400)
          .json({ message: "Vui lòng chọn ít nhất 1 chuyên mục" });
      image_url = image_url.path.replace(/\\/g, "/");

      const newArticle = await Article.create({
        user_id,
        title,
        content,
        tags,
        is_draft,
        privacy:
          req.user.role === "admin"
            ? parseInt(is_draft) === 1
              ? "private"
              : "public"
            : "private",
        slug,
        image_url,
      });

      selectedCategories.forEach(async (category) => {
        await ArticleCategory.create({
          article_id: newArticle.article_id,
          category_id: category.value,
        });
      });

      return res
        .status(201)
        .json({ message: "Thêm bài viết thành công", article: newArticle });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi khi thêm bài viết", error });
    }
  }

  // [POST] /articles/uploadImage
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Vui lòng chọn ảnh" });
      }

      const image_url = req.file.path.replace(/\\/g, "/"); // Normalize path

      return res.status(200).json({
        uploaded: true,
        url: `https://kltn-itblog-be-1.onrender.com/${image_url}`, // Đường dẫn tới file đã tải lên
      });
    } catch (error) {
      res.status(500).json({ message: "Error uploading image", error });
    }
  }

  // [PUT] /articles/:id/public
  async public(req, res) {
    const { id } = req.params;

    try {
      const article = await Article.findOne({ where: { article_id: id } });

      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      await article.update({ privacy: "public", is_draft: 0 });

      res
        .status(200)
        .json({ message: "Đã duyệt bài viết thành công", article });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi duyệt bài viết", error });
    }
  }

  // [PUT] /articles/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, content, tags, slug, is_draft, categories } = req.body;

      const image_url = req.file;

      const article = await Article.findOne({ where: { article_id: id } });

      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      if (req.user.role != "admin" && req.user.userId != article.user_id)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền thực hiện" });
      if (slug && slug !== article.slug) {
        const existingArticle = await Article.findOne({ where: { slug } });
        if (existingArticle) {
          return res.status(400).json({ message: "Đường dẫn đã tồn tại" });
        }
      }

      // Parse categories từ req.body (nó sẽ là JSON string)
      const selectedCategories = JSON.parse(categories);

      if (!selectedCategories || selectedCategories.length <= 0)
        return res
          .status(400)
          .json({ message: "Vui lòng chọn ít nhất 1 chuyên mục" });

      let imageUrl = article.image_url;
      if (image_url) {
        if (article.image_url) {
          const oldImagePath = path.join(
            __dirname,
            "..",
            "..",
            article.image_url,
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        imageUrl = image_url.path.replace(/\\/g, "/");
      }

      if (is_draft == 1) {
        await article.update({
          title,
          content,
          tags,
          slug,
          is_draft,
          image_url: imageUrl,
          privacy: "private",
        });
      } else {
        await article.update({
          title,
          content,
          tags,
          slug,
          is_draft,
          image_url: imageUrl,
          privacy: req.user.role == "admin" ? "public" : "private",
        });
      }

      await ArticleCategory.destroy({ where: { article_id: id } });

      selectedCategories.forEach(async (category) => {
        await ArticleCategory.create({
          article_id: id,
          category_id: category.value,
        });
      });

      return res
        .status(200)
        .json({ message: "Cập nhật bài viết thành công", article });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi cập nhật bài viết", error });
    }
  }

  // [PUT] /articles/:id/draft
  async draft(req, res) {
    const { id } = req.params;
    const { title, content, tags, slug } = req.body;
    const image_url = req.file;

    try {
      const article = await Article.findOne({ where: { article_id: id } });

      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      if (req.user.role != "admin" && req.user.userId != article.user_id)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền thực hiện" });
      if (slug && slug !== article.slug) {
        const existingArticle = await Article.findOne({ where: { slug } });
        if (existingArticle) {
          return res.status(400).json({ message: "Đường dẫn đã tồn tại" });
        }
      }

      let imageUrl = article.image_url;
      if (image_url) {
        if (article.image_url) {
          const oldImagePath = path.join(
            __dirname,
            "..",
            "..",
            article.image_url,
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        imageUrl = image_url.path.replace(/\\/g, "/");
      }

      await article.update({
        title,
        content,
        tags,
        is_draft: 1,
        slug,
        image_url: imageUrl,
        privacy: "private",
      });

      res
        .status(200)
        .json({ message: "Lưu bản nháp bài viết thành công", article });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lưu bản nháp bài viết", error });
    }
  }

  // [DELETE] /articles/:id
  async delete(req, res) {
    const { id } = req.params;

    try {
      const article = await Article.findOne({ where: { article_id: id } });

      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      if (req.user.role != "admin" && req.user.userId != article.user_id)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền thực hiện" });
      if (article.image_url) {
        const imagePath = path.join(__dirname, "..", "..", article.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Xóa tất cả các thông báo liên quan đến bài viết
      await Notification.destroy({ where: { article_id: id } });

      // Xóa tất cả các bình luận liên quan đến bài viết
      await Comment.destroy({ where: { article_id: id } });

      // Xóa tất cả các lượt xem liên quan đến bài viết
      await ArticleView.destroy({ where: { article_id: id } });

      await article.destroy();

      res.status(200).json({ message: "Xóa bài viết thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa bài viết", error });
    }
  }

  // [PATCH] /articles/:id/reject
  async reject(req, res) {
    const { id } = req.params;
    const { reason } = req.body; // Lấy lý do từ chối từ body request

    try {
      const article = await Article.findOne({ where: { article_id: id } });

      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      // Kiểm tra nếu bài viết đã ở trạng thái public
      if (article.privacy === "public") {
        return res
          .status(400)
          .json({ message: "Bài viết đã được duyệt, không thể từ chối" });
      }

      // Cập nhật slug và tiêu đề bài viết khi từ chối
      const updatedTitle = `[Bị từ chối vì ${reason}] ${article.title}`;
      await article.update({
        slug: "[rejected]",
        title: updatedTitle,
        is_draft: 1,
      });

      res.status(200).json({ message: "Bài viết đã bị từ chối", article });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi từ chối bài viết", error });
    }
  }
  // [GET] /articles/list/rejected
  async listRejected(req, res) {
    const { search, page = 1, limit = 10 } = req.query;
    const { role, userId } = req.user; // Lấy user_id từ thông tin đăng nhập của user (giả sử user đã được xác thực)
    const offset = (page - 1) * limit;

    try {
      let whereClause = search ? { title: { [Op.like]: `%${search}%` } } : {};

      whereClause = {
        ...whereClause,
        slug: "[rejected]", // Chỉ lấy các bài viết bị từ chối
        user_id: userId, // Lọc theo user_id
      };
      const { rows, count } = await Article.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["article_id", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);
      res.status(200).json({
        totalArticles: count,
        currentPage: parseInt(page),
        totalPages,
        articles: rows,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi truy vấn bài viết bị từ chối", error });
    }
  }
  // [GET] /articles/list/rejected/:id
  async detailRejected(req, res) {
    const { id } = req.params;
    try {
      // Tìm bài viết bị từ chối dựa trên id
      const article = await Article.findOne({
        where: {
          article_id: id,
        },
      });
      if (!article) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }

      if (req.user.userId != article.user_id)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền thực hiện" });

      // Trả về thông tin bài viết và danh mục
      return res.status(200).json({
        article,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi lấy bài viết bị từ chối", error });
    }
  }
}

module.exports = new ArticleController();
