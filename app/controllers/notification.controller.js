const { Op } = require('sequelize');
const Notification = require('../models/notification.model.js');
const User = require('../models/user.model.js');
const Article = require('../models/article.model.js');

async function index(req, res) {
    const user_id = req.user.userId; // Lấy userId từ token
    const { page = 1, limit = 10 } = req.query; // Lấy các tham số phân trang từ query, mặc định page=1, limit=10

    try {
        const offset = (page - 1) * limit; // Tính offset

        // Truy vấn thông báo với phân trang và điều kiện user_id, bao gồm thông tin user và article
        const { rows, count } = await Notification.findAndCountAll({
            where: {
                user_id: user_id // Chỉ lấy thông báo của người dùng hiện tại
            },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']], // Sắp xếp thông báo theo thứ tự mới nhất
            include: [
                {
                    model: User,
                    as: 'related_user', // Thông tin của người dùng liên quan đến thông báo
                    attributes: ['fullname', 'avatar_url']
                },
                {
                    model: Article,
                    attributes: ['title', 'slug'] // Lấy title của bài viết
                }
            ]
        });

        const totalPages = Math.ceil(count / limit); // Tính tổng số trang

        // Trả về danh sách thông báo với định dạng JSON
        res.status(200).json({
            totalNotifications: count, // Tổng số thông báo
            currentPage: parseInt(page), // Trang hiện tại
            totalPages, // Tổng số trang
            notifications: rows.map(notification => ({
                notification_id: notification.notification_id,
                type: notification.type,
                createdAt: notification.createdAt,
                user: {
                    fullname: notification.related_user?.fullname,
                    avatar_url: notification.related_user?.avatar_url
                },
                article: {
                    title: notification.article?.title,
                    slug: notification.article?.slug
                }
            })) // Danh sách thông báo kèm thông tin user và article
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông báo', error });
    }
}

module.exports = { index };
