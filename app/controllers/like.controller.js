const { Op } = require('sequelize');
const ArticleLike = require('../models/article_like.model');
const Article = require('../models/article.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

class LikeController {
    // [GET] /likes/:id
    async getByArticle(req, res) {
        try {
            const { id } = req.params;

            const likes = await ArticleLike.count({
                where: { article_id: id }
            });

            return res.status(200).json({ message: 'Lấy lượt thích thành công', likes });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi lấy lượt thích', error });
        }
    }

    // [POST] /likes/:id
    async add(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.userId;
    
            // Kiểm tra xem bài viết có tồn tại không
            const article = await Article.findOne({ where: { article_id: id } });
    
            if (!article) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết' });
            }
    
            // Kiểm tra nếu người dùng đã thích bài viết này chưa
            const existingLike = await ArticleLike.findOne({
                where: { article_id: id, user_id }
            });
    
            if (existingLike) {
                const like = await ArticleLike.findOne({
                    where: { article_id: id, user_id }
                });
    
                // Xóa thông báo liên quan đến lượt thích (nếu có)
                await Notification.destroy({
                    where: {
                        article_id: id,
                        related_user_id: user_id,
                        type: "like"
                    }
                });
    
                // Xóa lượt thích
                await like.destroy();
                return res.status(400).json({ message: 'Hủy thích bài viết' });
            }
    
            // Thêm lượt thích mới
            const newLike = await ArticleLike.create({
                article_id: id,
                user_id
            });
    
            // Tạo thông báo nếu người thích không phải là chủ bài viết
            const articleOwnerId = article.user_id;
            if (articleOwnerId !== user_id) {
                await Notification.create({
                    user_id: articleOwnerId,
                    type: "like",
                    related_user_id: user_id,
                    article_id: id
                });
            }
    
            return res.status(201).json({ message: 'Đã thích bài viết' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi thực hiện', error });
        }
    }

    // [GET] /likes/:id/liked
    async checkUserLiked(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.userId;

            // Kiểm tra nếu người dùng đã thích bài viết này chưa
            const existingLike = await ArticleLike.findOne({
                where: { article_id: id, user_id }
            });

            if(existingLike) return res.status(200).json({ liked: true });

            return res.status(200).json({ liked: false });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi truy vấn', error });
        }
    }
}

module.exports = new LikeController();
