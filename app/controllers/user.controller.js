const { Op } = require("sequelize");
const User = require("../models/user.model.js");
const Follower = require("../models/follower.model.js");
const createUploader = require('../middlewares/upload.middleware.js');
const bcrypt = require("bcryptjs");

const upload = createUploader();

class UserController {
  // [GET] /users
  async index(req, res) {
    try {
      // Nhận tham số từ query (nếu không có thì mặc định)
      const { page = 1, limit = 10, search = "" } = req.query;

      // Chuyển đổi page và limit sang kiểu số nguyên
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      const offset = (pageNumber - 1) * limitNumber;

      // Điều kiện tìm kiếm theo username hoặc email (có thể tùy chỉnh)
      const searchCondition = {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { fullname: { [Op.like]: `%${search}%` } }
        ]
      };

      // Tìm kiếm và phân trang
      const { rows: users, count: totalUsers } = await User.findAndCountAll({
        where: searchCondition,
        attributes: ['user_id', 'username', 'email', 'fullname', 'avatar_url', 'bio', 'role', 'createdAt'],
        limit: limitNumber,
        offset: offset
      });

      // Trả về kết quả với tổng số người dùng và các thông tin phân trang
      res.status(200).json({
        totalUsers,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalUsers / limitNumber),
        users
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng", error });
    }
  }

  // [GET] /user/:id
  async show(req, res) {
    try {
      const { id } = req.params; // Có thể là user_id hoặc username

      // Tìm người dùng bằng user_id hoặc username
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { user_id: id },      // Tìm theo user_id
            { username: id }      // Tìm theo username
          ]
        },
        attributes: ['user_id', 'username', 'email', 'fullname', 'avatar_url', 'bio', 'role', 'createdAt']
      });

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Lấy số lượng follower của người dùng
      const followerCount = await Follower.count({
        where: { followed_user_id: user.user_id }
      });

      // Trả về thông tin người dùng cùng số lượng follower
      res.status(200).json({
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          fullname: user.fullname,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt
        },
        followerCount
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng", error });
    }
  }

  // [GET] /user/profile
  async profile(req, res) {
    try {
      const userId = req.user.userId; // id lấy từ token đã xác thực
      const user = await User.findByPk(userId, {
        attributes: ['user_id', 'username', 'email', 'fullname', 'avatar_url', 'bio', 'role', 'createdAt']
      });
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      const followerCount = await Follower.count({
        where: { followed_user_id: user.user_id }
      });

      return res.status(200).json({user, followerCount});
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy thông tin hồ sơ", error });
    }
  }

  // [PUT] /users
  async update(req, res) {
    try {
      const userId = req.user.userId; // id lấy từ token đã xác thực

      const { fullname, bio } = req.body;

      if (!fullname) return res.status(400).json({ message: "Họ tên là bắt buộc" });

      // Thực hiện upload avatar nếu có file
      if (req.file) {
        let avatar_url = req.file.path.replace(/\\/g, '/');
        await User.update(
          { fullname, avatar_url, bio },
          { where: { user_id: userId } }
        );
      } else {
        await User.update(
          { fullname, bio },
          { where: { user_id: userId } }
        );
      }

      const updatedUser = await User.findOne(
        {
          where: { user_id: userId },
          attributes: ['user_id', 'username', 'email', 'fullname', 'avatar_url', 'bio', 'role', 'createdAt']
        }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      res.status(200).json({ message: "Cập nhật thông tin thành công", user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi cập nhật thông tin", error });
    }
  }

  async changePassword(req, res){
    try{
      const userId = req.user.userId; // id lấy từ token đã xác thực

      const { password, newPassword, confirmPassword } = req.body;

      if(!password || !newPassword || !confirmPassword) return res.status(404).json({ message: "Vui lòng nhập đủ thông tin đổi mật khẩu" });

      // Tìm user theo id user
      const user = await User.findOne({
          where: {
            user_id: userId
          }
      });

      // Kiểm tra mật khẩu
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
          return res.status(400).json({ message: "Mật khẩu hiện tại không đúng!" });
      }

      if(newPassword !== confirmPassword) return res.status(400).json({ message: "Nhập lại mật khẩu không trùng khớp!" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.update(
        { password_hash: hashedPassword },
        { where: { user_id: userId } }
      );

      return res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi đổi mật khẩu", error });
    }
  }

  // [PATCH] /users/:id/block
  async block(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ message: "Không thể khóa quản trị viên" });
      }

      if (user.role != 'blocked') {
        await User.update(
          { role: 'blocked' },
          { where: { user_id: id } }
        );
        return res.status(200).json({ message: "Người dùng đã bị khóa" });
      }else{
        await User.update(
          { role: 'user' },
          { where: { user_id: id } }
        );

        return res.status(200).json({ message: "Đã mở khóa cho người dùng" });
      }

    } catch (error) {
      res.status(500).json({ message: "Lỗi khi khóa người dùng", error });
    }
  }
  // [PATCH] /users/:id/toggleAdmin
  async toggleAdmin(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      //Kiểm tra người dùng bị khóa
      if(user.role == "blocked") return res.status(400).json({ message: "Tài khoản hiện đang bị cấm khỏi hệ thống" });

      // Nếu user đang là 'admin', thì đổi role thành 'user', ngược lại thì đổi thành 'admin'
      if (user.role === 'admin') {
        await User.update(
          { role: 'user' },
          { where: { user_id: id } }
        );
        return res.status(200).json({ message: "Đã thay đổi role thành user" });
      } else {
        await User.update(
          { role: 'admin' },
          { where: { user_id: id } }
        );
        return res.status(200).json({ message: "Đã thay đổi role thành admin" });
      }

    } catch (error) {
      res.status(500).json({ message: "Lỗi khi thay đổi role người dùng", error });
    }
  }
}

module.exports = new UserController();
