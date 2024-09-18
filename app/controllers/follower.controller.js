const Follower = require('../models/follower.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

const { Op } = require('sequelize');

const FollowerController = {
    // [GET] followers/:id
    async show(req, res) {
        const follower_user_id = req.user.userId; // Lấy ID của người đang đăng nhập
        const { id } = req.params;  // ID này có thể là user_id hoặc username của người được follow

        try {
            // Tìm người dùng theo user_id hoặc username
            const followedUser = await User.findOne({
                where: {
                    [Op.or]: [
                        { user_id: id },      // Tìm theo user_id
                        { username: id }      // Tìm theo username
                    ]
                }
            });

            // Nếu không tìm thấy người dùng
            if (!followedUser) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }

            const followed_user_id = followedUser.user_id;

            // Lấy số lượng người theo dõi người dùng này
            const followerCount = await Follower.count({
                where: { followed_user_id }
            });

            // Kiểm tra xem người dùng hiện tại có đang theo dõi người dùng này không
            const isFollowing = await Follower.findOne({
                where: {
                    follower_user_id,
                    followed_user_id
                }
            });

            // Trả về số lượng follower và trạng thái follow
            return res.status(200).json({
                followerCount,
                isFollowing: !!isFollowing  // Trả về true nếu đang theo dõi, false nếu không
            });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi khi lấy thông tin follower', error });
        }
    },

    // [POST] followers/:id
    async add(req, res) {
        const follower_user_id = req.user.userId; 
        const followed_user_id = req.params.id; 

        try {
            // Kiểm tra xem người dùng có tồn tại không
            const followedUser = await User.findOne({ where: { user_id: followed_user_id } });
            if (!followedUser) {
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }

            // Kiểm tra xem đã follow chưa
            const existingFollower = await Follower.findOne({
                where: {
                    follower_user_id,
                    followed_user_id
                }
            });

            if (existingFollower) {
                // Nếu đã follow thì hủy follow
                await Follower.destroy({
                    where: { follower_id: existingFollower.follower_id }
                });

                return res.status(200).json({ message: 'Đã hủy theo dõi' });
            } else {
                // Nếu chưa follow thì thêm follow
                await Follower.create({
                    follower_user_id,
                    followed_user_id
                });

                // Tạo thông báo cho người được follow
                await Notification.create({
                    user_id: followed_user_id,
                    type: 'follow',
                    related_user_id: follower_user_id
                });

                return res.status(201).json({ message: 'Đã theo dõi thành công' });
            }
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi khi thực hiện follow/unfollow', error });
        }
    }
};

module.exports = FollowerController;
