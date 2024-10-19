const sequelize = require('../config/db.config.js');
const Article = require('../models/article.model.js');
const ArticleView = require('../models/article_view.model');
const ArticleCategory = require('../models/article_category.model.js');
const ArticleLike = require('../models/article_like.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const Category = require('../models/category.model.js');
const { Op, fn, col } = require("sequelize");

class OtherController {

    // [GET] /orthers/list_articles
    async listArticles(req, res) {
        const { search, page = 1, limit = 6 } = req.query;
        const offset = (page - 1) * limit;
        try {
            // Build where clause for search functionality
            let whereClause = search
                ? { title: { [Op.like]: `%${search}%` } }
                : {};

            whereClause = {
                ...whereClause,
                privacy: 'public' // Chỉ lấy các bài viết được duyệt
            };

            // Fetch articles with pagination and order
            const { rows, count } = await Article.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['article_id', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'user', // Alias defined in Article model
                        attributes: ['fullname', 'username'] // Include only the 'username' field
                    },
                    {
                        model: ArticleView,
                        as: 'views', // Alias defined in relationship
                        attributes: ['view_count'], // Lấy lượt xem
                    }
                ]
            });

            const totalPages = Math.ceil(count / limit);

            // Send response in the desired format
            res.status(200).json({
                totalArticles: count, // Total number of articles
                currentPage: parseInt(page), // Current page
                totalPages, // Total pages
                articles: rows, // Array of articles
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi truy vấn bài viết", error });
        }
    }

    async topMonthView(req, res) {
        try {
            const { page = 1, limit = 6 } = req.query; // Lấy page và limit từ query, với mặc định là 1 và 10
            const offset = (page - 1) * limit;
    
            // Truy vấn lấy các bài viết theo số lượt xem trong tháng hiện tại, áp dụng phân trang
            const query = `
                SELECT 
                    a.article_id, 
                    a.title, 
                    a.slug, 
                    a.image_url, 
                    a.user_id, 
                    a.content,
                    a.createdAt, 
                    u.username, 
                    u.fullname, 
                    COALESCE(SUM(av.view_count), 0) AS total_views
                FROM articles AS a
                LEFT JOIN article_views AS av ON a.article_id = av.article_id
                LEFT JOIN users AS u ON a.user_id = u.user_id  
                WHERE YEAR(a.createdAt) = YEAR(CURRENT_DATE)  
                    AND MONTH(a.createdAt) = MONTH(CURRENT_DATE)  
                GROUP BY 
                    a.article_id, 
                    a.title, 
                    a.slug, 
                    a.image_url, 
                    a.user_id, 
                    a.createdAt,
                    u.username 
                ORDER BY total_views DESC
                LIMIT :limit OFFSET :offset;
            `;
    
            // Truy vấn đếm tổng số bài viết trong tháng hiện tại
            const countQuery = `
                SELECT COUNT(DISTINCT a.article_id) AS totalArticles
                FROM articles AS a
                WHERE YEAR(a.createdAt) = YEAR(CURRENT_DATE)
                    AND MONTH(a.createdAt) = MONTH(CURRENT_DATE);
            `;
    
            // Thực thi các truy vấn
            const articles = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT,
                replacements: { limit: parseInt(limit), offset: parseInt(offset) },
            });
    
            const countResult = await sequelize.query(countQuery, {
                type: sequelize.QueryTypes.SELECT,
            });
    
            const totalArticles = countResult[0].totalArticles;
            const totalPages = Math.ceil(totalArticles / limit);
    
            // Trả về kết quả
            res.status(200).json({
                totalArticles,
                currentPage: parseInt(page),
                totalPages,
                articles,
            });
        } catch (error) {
            res.status(500).json({
                message: 'Lỗi khi lấy bài viết có lượt xem cao nhất',
                error
            });
        }
    }
    

    async getArticlesByUsername(req, res) {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const { username } = req.params;

        try {
            const user = await User.findOne({
                where: {
                    username
                }
            });

            if(!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

            // Build where clause for search functionality
            let whereClause = search
                ? { title: { [Op.like]: `%${search}%` } }
                : {};
            
            whereClause = {
                ...whereClause,
                privacy: "public",
                user_id: user.user_id 
            };

            // Fetch articles with pagination, order, and include user info & views
            const { rows, count } = await Article.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['article_id', 'DESC']], // Order by article_id in descending order
                include: [
                    {
                        model: User,
                        as: 'user', // Alias defined in Article model
                        attributes: ['username'] // Include only the 'username' field
                    },
                    {
                        model: ArticleView,
                        as: 'views', // Alias defined in relationship
                        attributes: ['view_count'], // Lấy lượt xem
                    }
                ]
            });

            const totalPages = Math.ceil(count / limit);

            // Send response in the desired format
            res.status(200).json({
                totalArticles: count, // Total number of articles
                currentPage: parseInt(page), // Current page
                totalPages, // Total pages
                articles: rows, // Array of articles with user info and view count
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi truy vấn bài viết", error });
        }
    }

    // [GET] /orthers/top_interacts
    async topInteract(req, res) {
        try {
            const query = `
                SELECT 
                    a.article_id, 
                    a.title, 
                    a.slug, 
                    a.image_url, 
                    a.user_id, 
                    a.createdAt, 
                    u.username,
                    u.avatar_url,
                    COALESCE(COUNT(ac.comment_id), 0) AS total_comments  -- Tính số lượng bình luận
                FROM articles AS a
                LEFT JOIN comments AS ac ON a.article_id = ac.article_id  -- JOIN với bảng comments
                LEFT JOIN users AS u ON a.user_id = u.user_id  -- JOIN với bảng users để lấy username
                GROUP BY 
                    a.article_id, 
                    a.title, 
                    a.slug, 
                    a.image_url, 
                    a.user_id, 
                    a.createdAt,
                    u.username  -- Thêm username vào GROUP BY
                ORDER BY total_comments DESC
                LIMIT 4;
            `;
            // Trả về kết quả
            res.status(200).json({
                message: '4 bài viết có lượt comments cao nhất',
                articles: await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            });
        } catch (error) {
            res.status(500).json({
                message: 'Lỗi khi lấy bài viết có lượt xem cao nhất',
                error
            });
        }
    }

    // [GET] /orthers/top_trendings
    async topTrending(req, res) {
        const { limit = 2 } = req.query; // Số bài viết top trending mỗi loại (mặc định là 2)

        try {
            // Truy vấn top trending bài viết theo lượt xem
            const topViews = await sequelize.query(`
            SELECT a.article_id, a.user_id, a.title, a.content, a.tags, a.privacy, a.is_draft, a.slug, a.image_url, a.createdAt, a.updatedAt, u.username, u.fullname,
                COALESCE(SUM(av.view_count), 0) AS total_views
            FROM articles a
            LEFT JOIN article_views av ON a.article_id = av.article_id
            LEFT JOIN users u ON a.user_id = u.user_id
            GROUP BY a.article_id, u.username
            ORDER BY total_views DESC
            LIMIT :limit;
        `, {
                replacements: { limit: parseInt(limit, 10) },
                type: sequelize.QueryTypes.SELECT
            });

            // Truy vấn top trending bài viết theo lượt thích
            const topLikes = await sequelize.query(`
            SELECT a.article_id, a.user_id, a.title, a.content, a.tags, a.privacy, a.is_draft, a.slug, a.image_url, a.createdAt, a.updatedAt, u.username, u.fullname,
                COALESCE(COUNT(al.like_id), 0) AS total_likes
            FROM articles a
            LEFT JOIN article_likes al ON a.article_id = al.article_id
            LEFT JOIN users u ON a.user_id = u.user_id
            GROUP BY a.article_id, u.username
            ORDER BY total_likes DESC
            LIMIT :limit;
        `, {
                replacements: { limit: parseInt(limit, 10) },
                type: sequelize.QueryTypes.SELECT
            });

            // Truy vấn top trending bài viết theo bình luận
            const topComments = await sequelize.query(`
            SELECT a.article_id, a.user_id, a.title, a.content, a.tags, a.privacy, a.is_draft, a.slug, a.image_url, a.createdAt, a.updatedAt, 
                u.username, u.fullname, 
                COALESCE(COUNT(c.comment_id), 0) AS total_comments
            FROM articles a
            LEFT JOIN comments c ON a.article_id = c.article_id
            LEFT JOIN users u ON a.user_id = u.user_id
            GROUP BY a.article_id, u.username
            ORDER BY total_comments DESC
            LIMIT :limit;
        `, {
                replacements: { limit: parseInt(limit, 10) },
                type: sequelize.QueryTypes.SELECT
            });

            // Kết hợp các bài viết top trending từ các truy vấn khác nhau vào một mảng duy nhất
            const uniqueArticles = {};

            // Kiểm tra kiểu dữ liệu và kết hợp kết quả
            if (Array.isArray(topViews)) {
                topViews.forEach(article => uniqueArticles[article.article_id] = article);
            }
            if (Array.isArray(topLikes)) {
                topLikes.forEach(article => uniqueArticles[article.article_id] = article);
            }
            if (Array.isArray(topComments)) {
                topComments.forEach(article => uniqueArticles[article.article_id] = article);
            }

            // Chuyển đổi đối tượng thành mảng và sắp xếp theo article_id
            const articles = Object.values(uniqueArticles).sort((a, b) => b.article_id - a.article_id);

            // Gửi phản hồi JSON chứa các bài viết top trending
            res.status(200).json({
                message: "Danh sách bài viết Top Trending theo lượt xem, lượt thích và bình luận",
                articles
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi lấy bài viết top trending', error });
        }
    }

    // [GET] /other/list_categories
    async listCategories(req, res) {
        const { search } = req.query;

        try {
            // Build where clause for search functionality
            const whereClause = search
                ? { name: { [Op.like]: `%${search}%` } }
                : {};

            // Fetch all categories without pagination
            const categories = await Category.findAll({
                where: whereClause,
                order: [['category_id', 'DESC']],
            });

            // Send response with all categories
            res.status(200).json({
                totalCategories: categories.length, // Total number of categories
                categories, // Array of categories
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi truy vấn danh mục", error });
        }
    }

    // [GET] /orthers/last_comments
    async lastComments(req, res) {
        try {
            const comments = await Comment.findAll({
                limit: 3, // Giới hạn lấy 3 bình luận
                order: [['createdAt', 'DESC']], // Sắp xếp theo thời gian mới nhất
                include: [
                    {
                        model: User, // Bao gồm thông tin người dùng
                        attributes: ['fullname', 'avatar_url', 'username'] // Chỉ lấy tên và avatar
                    },
                    {
                        model: Article, // Bao gồm thông tin bài viết
                        attributes: ['title', 'slug'] // Chỉ lấy tiêu đề và slug của bài viết
                    }
                ]
            });

            res.status(200).json({
                message: '3 bình luận mới nhất',
                comments
            });
        } catch (error) {
            res.status(500).json({
                message: 'Lỗi khi lấy bình luận',
                error
            });
        }
    }

    async mostPopular(req, res) {
        try {
            const query = `
                SELECT 
                    a.article_id, 
                    a.title, 
                    a.slug, 
                    a.image_url, 
                    a.user_id, 
                    a.createdAt, 
                    u.username, 
                    u.fullname, 
                    COALESCE(SUM(av.view_count), 0) AS total_views
                FROM articles AS a
                LEFT JOIN article_views AS av ON a.article_id = av.article_id
                LEFT JOIN users AS u ON a.user_id = u.user_id  -- JOIN với bảng users để lấy username
                GROUP BY 
                    a.article_id, 
                    a.title, 
                    a.slug, 
                    a.image_url, 
                    a.user_id, 
                    a.createdAt,
                    u.username 
                ORDER BY total_views DESC
                LIMIT 3;
            `;

            // Trả về kết quả
            res.status(200).json({
                message: '3 bài viết có lượt xem cao nhất',
                articles: await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            });
        } catch (error) {
            res.status(500).json({
                message: 'Lỗi khi lấy bài viết có lượt xem cao nhất',
                error
            });
        }
    }

    async newUsers(req, res) {
        const { limit = 18 } = req.query; // Số lượng người dùng muốn lấy (mặc định là 10)
        try {
            const users = await User.findAll({
                order: [['createdAt', 'DESC']], // Sắp xếp theo ngày tạo (người dùng mới nhất trước)
                limit: parseInt(limit) // Giới hạn số lượng người dùng trả về
            });
    
            res.status(200).json({
                totalUsers: users.length,
                users: users,
            });
        } catch (error) {
            console.error("Lỗi khi lấy người dùng mới:", error);
            res.status(500).json({ message: "Lỗi khi lấy người dùng mới", error });
        }
    }

    async topCategories(req, res) {
        try {
            const query = `
                SELECT c.category_id, c.name, c.slug, c.image_url, COUNT(ac.article_id) AS article_count
                FROM categories c
                JOIN article_categories ac ON c.category_id = ac.category_id
                JOIN articles a ON ac.article_id = a.article_id
                WHERE a.is_draft = 0 AND a.privacy = 'public'
                GROUP BY c.category_id, c.name, c.slug, c.image_url
                ORDER BY article_count DESC
                LIMIT 4;
            `;

            // Trả về kết quả
            res.status(200).json({
                message: 'Top chuyên mục có nhiều bài viết',
                categories: await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            });
        } catch (error) {
            res.status(500).json({
                message: 'Lỗi khi lấy chuyên mục',
                error
            });
        }
    }

    async topRelated(req, res) {
        try {
            const { categoryIds, tags } = req.body;
            const { id } = req.params;

            // Chuyển danh sách categoryIds và tags thành chuỗi để sử dụng trong SQL
            const categoryIdsList = categoryIds.join(','); // e.g., "1,2,3"
            const tagsConditions = tags.map(tag => `tags LIKE '%${tag}%'`).join(' OR '); // e.g., "tags LIKE '%tag1%' OR tags LIKE '%tag2%'"

            // Truy vấn lấy bài viết cho các category
            const categoryQuery = `
                SELECT a.*, u.username, u.fullname, c.name AS category_name, c.slug AS category_slug
                FROM articles a
                JOIN article_categories ac ON a.article_id = ac.article_id
                JOIN users u ON a.user_id = u.user_id 
                JOIN categories c ON ac.category_id = c.category_id
                WHERE ac.category_id IN (${categoryIdsList})
                AND a.privacy = 'public'
                AND a.is_draft = false
                AND a.article_id <> ${id}  
                ORDER BY a.createdAt DESC
                LIMIT 3;
            `;


            // Truy vấn lấy bài viết dựa trên tags
            const tagQuery = `
                SELECT a.*, u.username, u.fullname, c.name AS category_name, c.slug AS category_slug
                FROM articles a
                JOIN article_categories ac ON a.article_id = ac.article_id
                JOIN users u ON a.user_id = u.user_id 
                JOIN categories c ON ac.category_id = c.category_id
                WHERE (${tagsConditions})
                AND a.privacy = 'public'
                AND a.is_draft = false
                AND a.article_id <> ${id} 
                ORDER BY a.createdAt DESC
                LIMIT 3;
            `;

            // Thực hiện các truy vấn SQL
            const [categoryArticles] = await sequelize.query(categoryQuery);
            const [tagArticles] = await sequelize.query(tagQuery);

            // Kết hợp tất cả bài viết từ các chuyên mục và từ tags
            const allArticles = categoryArticles.concat(tagArticles);

            // Trả về kết quả
            res.status(200).json({
                message: 'Bài viết liên quan',
                articles: allArticles
            });
        } catch (error) {
            console.error('Lỗi khi lấy bài viết liên quan:', error);
            res.status(500).json({ message: 'Có lỗi xảy ra khi lấy bài viết liên quan' });
        }
    }    

    async topPopularToday(req, res) {
        try {
            const query = `
                SELECT a.*, u.username, u.avatar_url, u.fullname, c.name AS category_name, c.slug AS category_slug, av.view_count
                FROM articles a
                JOIN article_views av ON a.article_id = av.article_id
                JOIN users u ON a.user_id = u.user_id
                JOIN article_categories ac ON a.article_id = ac.article_id
                JOIN categories c ON ac.category_id = c.category_id
                WHERE a.privacy = 'public'
                  AND a.is_draft = false
                  AND DATE(a.createdAt) <= CURDATE()  -- Lấy các bài viết từ hôm nay trở về trước
                ORDER BY DATE(a.createdAt) DESC, av.view_count DESC
                LIMIT 1;
            `;
    
            const [results] = await sequelize.query(query);
    
            if (results.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết phù hợp.' });
            }
    
            // Chỉ lấy bài viết đầu tiên do có `LIMIT 1` trong query
            const article = results[0];
    
            return res.status(200).json({ article });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Có lỗi xảy ra khi lấy bài viết.', error });
        }
    }

}

module.exports = new OtherController();
