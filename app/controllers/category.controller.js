const Category = require('../models/category.model.js');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

class CategoryController {

  // [GET] /categories?search=term&page=1&limit=10
  async index(req, res) {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
      // Build where clause for search functionality
      const whereClause = search
        ? { name: { [Op.like]: `%${search}%` } }
        : {};

      // Fetch categories with pagination
      const { rows, count } = await Category.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['category_id', 'DESC']],
      });

      const totalPages = Math.ceil(count / limit);

      // Send response in the desired format
      res.status(200).json({
        totalCategories: count, // Total number of categories
        currentPage: parseInt(page), // Current page
        totalPages, // Total pages
        categories: rows, // Array of categories
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi truy vấn danh mục", error });
    }
  }


  // [GET] /categories/:idOrSlug
  async show(req, res) {
    const { idOrSlug } = req.params;

    try {
      const category = await Category.findOne({
        where: {
          [Op.or]: [
            { category_id: idOrSlug },
            { slug: idOrSlug }
          ]
        }
      });

      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh mục", error });
    }
  }

  // [POST] /categories
  async add(req, res) {
    const { name, slug } = req.body;
    let image_url = req.file; // Handle image upload

    try {

      if (!name || !slug) return res.status(400).json({ message: "Tên và đường dẫn danh mục là bắt buộc" });

      if (!image_url) return res.status(400).json({ message: "Vui lòng chọn ảnh danh mục" });

      // Kiểm tra xem slug có bị trùng hay không
      const existingCategory = await Category.findOne({ where: { slug } });
      if (existingCategory) {
          return res.status(400).json({ message: "Đường dẫn đã tồn tại, vui lòng chọn đường dẫn khác" });
      }

      image_url = image_url.path.replace(/\\/g, '/');

      const newCategory = await Category.create({
        name,
        slug,
        image_url
      });

      return res.status(201).json({ message: "Thêm danh mục thành công", category: newCategory });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi khi thêm danh mục", error });
    }
  }

  // [PUT] /categories/:id
  async update(req, res) {
    const { id } = req.params;
    const { name, slug } = req.body;
    const image_url = req.file; // Handle image upload

    try {
      const category = await Category.findOne({ where: { category_id: id } });

      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }

      if (slug && slug !== category.slug) {
        const existingSlug = await Category.findOne({ where: { slug } });
        if (existingSlug) {
            return res.status(400).json({ message: "Đường dẫn đã tồn tại" });
        }
      }

      let imageUrl = category.image_url;
      if (image_url) {
        // Delete old image if it exists
        if (category.image_url) {
          const oldImagePath = path.join(__dirname, '..', '..', category.image_url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        imageUrl = image_url.path.replace(/\\/g, '/');
      }

      await category.update({ name, slug, image_url: imageUrl });

      res.status(200).json({ message: "Cập nhật danh mục thành công", category });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi cập nhật danh mục", error });
    }
  }

  // [DELETE] /categories/:id
  async delete(req, res) {
    const { id } = req.params;

    try {
      const category = await Category.findOne({ where: { category_id: id } });

      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }

      // Delete the image file if it exists
      if (category.image_url) {
        const imagePath = path.join(__dirname, '..', '..', category.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await category.destroy();

      res.status(200).json({ message: "Xóa danh mục thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa danh mục", error });
    }
  }
}

module.exports = new CategoryController();
