const { Op } = require('sequelize');
const Comment = require('../models/comment.model');
const Article = require('../models/article.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

class CommentController {
    // [GET] /comments
    async index(req, res) {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        try {
            // Build where clause for search functionality (search in article title or username)
            const whereClause = search
                ? {
                    [Op.or]: [
                        { '$article.title$': { [Op.like]: `%${search}%` } }, // Search by article title
                        { '$user.username$': { [Op.like]: `%${search}%` } }  // Search by user username
                    ]
                }
                : {};

            // Fetch comments with pagination, search, and order
            const { rows: comments, count } = await Comment.findAndCountAll({
                where: whereClause,
                include: [
                    { model: Article, attributes: ['title', 'slug'] }, // Include article title
                    { model: User, attributes: ['username'] }   // Include user info (username)
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            });

            const totalPages = Math.ceil(count / limit);

            // Send response in the desired format
            res.status(200).json({
                totalComments: count, // Total number of comments
                currentPage: parseInt(page), // Current page
                totalPages, // Total pages
                comments // Array of comments
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi truy vấn bình luận', error });
        }
    }

    // [GET] /comments/:id
    async getByArticle(req, res) {
        const { id } = req.params;

        try {
            const comments = await Comment.findAll({
                where: { article_id: id },
                include: [
                    { model: User, attributes: ['fullname','username','avatar_url'] }  // Include user info (username)
                ],
                order: [['createdAt', 'DESC']]
            });

            if (comments.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy bình luận cho bài viết này' });
            }

            res.status(200).json({ message: 'Lấy bình luận thành công', comments });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi lấy bình luận', error });
        }
    }

    // [POST] /comments
    async add(req, res) {
        const { content } = req.body;
        const { id } = req.params;
        const user_id = req.user.userId;  // Lấy ID người dùng từ token

        try {
            // Kiểm tra xem bài viết có tồn tại không
            const article = await Article.findOne({ where: { article_id: id } });

            if (!article) {
                return res.status(404).json({ message: "Không tìm thấy bài viết" });
            }

            // Kiểm tra dữ liệu comment và id bài viết
            if (!content || !id) {
                return res.status(400).json({ message: 'Thiếu dữ liệu bình luận hoặc bài viết' });
            }

            // Tạo bình luận mới
            const newComment = await Comment.create({
                article_id: id,  // Sửa lại trường này
                user_id,
                content
            });

            // Lấy thông tin người dùng
            const user = await User.findOne({
                where: { user_id },
                attributes: ['fullname', 'avatar_url', 'username']
            });

            // Lấy thông tin chủ bài viết (người nhận thông báo)
            const articleOwnerId = article.user_id;

            // Tạo thông báo cho chủ bài viết
            if (articleOwnerId !== user_id) {  // Không thông báo nếu người bình luận là chủ bài viết
                await Notification.create({
                    user_id: articleOwnerId,  // Chủ bài viết nhận thông báo
                    type: "comment",  // Loại thông báo là bình luận
                    related_user_id: user_id,  // Người thực hiện hành động
                    article_id: id,  // ID bài viết có liên quan
                    comment_id: newComment.comment_id  // ID bình luận có liên quan
                });
            }


            // Trả về phản hồi với thông tin bình luận và người dùng
            res.status(201).json({
                message: 'Thêm bình luận thành công',
                comment: {
                    id: newComment.comment_id,
                    article_id: newComment.article_id,
                    content: newComment.content,
                    createdAt: newComment.createdAt
                },
                user: {
                    fullname: user.fullname,
                    avatar_url: user.avatar_url,
                    username: user.username
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi thêm bình luận', error });
        }
    }

    // [DELETE] /comments/:id
    async delete(req, res) {
        const { id } = req.params;

        try {
            const comment = await Comment.findOne({ where: { comment_id: id } });

            if (!comment) {
                return res.status(404).json({ message: 'Không tìm thấy bình luận' });
            }

            // Check if the user is the comment owner or an admin
            if (comment.user_id !== req.user.userId && req.user.role != "admin") {
                return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' });
            }

            await comment.destroy();
            res.status(200).json({ message: 'Xóa bình luận thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi xóa bình luận', error });
        }
    }
}

module.exports = new CommentController();
