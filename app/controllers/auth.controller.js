const User = require("../models/user.model.js");
const PasswordReset = require("../models/password_reset.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Bí mật JWT từ biến môi trường
const JWT_EXPIRES_IN = '1h'; // Thời gian hết hạn của token
const JWT_REFRESH_EXPIRES_IN = '7d'; // Thời gian hết hạn của refresh token

class AuthController {

    // [POST] /register
    async register(req, res) {
        const { username, email, password, fullname } = req.body;

        try {
            // Kiểm tra xem user đã tồn tại chưa
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: "Email đã được sử dụng" });
            }

            // Kiểm tra xem username đã tồn tại chưa
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(400).json({ message: "Tài khoản đã được sử dụng" });
            }

            // Hash mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo user mới
            const newUser = await User.create({
                username,
                email,
                password_hash: hashedPassword,
                fullname,
                avatar_url: "uploads/users/avatar.jpg",
                role: "user"
            });

            return res.status(201).json({ message: "Đăng ký thành công", user: newUser });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi đăng ký", error });
        }
    }

    // [POST] /login
    async login(req, res) {
        const { username, password } = req.body;
        try {
            // Tìm user theo email hoặc username
            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: username },
                        { username: username }
                    ]
                }
            });

            if (!user) {
                return res.status(400).json({ message: "Email hoặc tên người dùng không đúng" });
            }

            // Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(400).json({ message: "Mật khẩu không đúng" });
            }

            if(user.role == "blocked") return res.status(400).json({ message: "Tài khoản hiện đang bị cấm khỏi hệ thống" });
            // Tạo JWT
            const token = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            const refreshToken = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

            return res.status(200).json({ message: "Đăng nhập thành công", token, refreshToken });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi đăng nhập", error });
        }
    }


    // [POST] /refresh-token
    async refreshToken(req, res) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: "Vui lòng cung cấp refresh token" });
        }

        try {
            // Xác thực refresh token
            const decoded = jwt.verify(refreshToken, JWT_SECRET);
            const newToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            const newRefreshToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

            return res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
        } catch (error) {
            return res.status(401).json({ message: "Refresh token không hợp lệ", error });
        }
    }

    // [POST] /users/password-reset
    async passwordReset(req, res) {
        const { email } = req.body;

        try {
            // Tìm user theo email
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
            }

            // Tạo mã token reset mật khẩu
            const resetToken = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 3600000); // Token hết hạn sau 1 giờ

            // Lưu token reset mật khẩu vào database
            await PasswordReset.create({
                user_id: user.user_id,
                reset_token: resetToken,
                expires_at: expiresAt
            });

            // Gửi email hoặc thông báo (ví dụ qua hệ thống gửi email của bạn)
            // Giả sử hệ thống sẽ gửi thông tin như dưới
            // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

            return res.status(200).json({ message: "Đã gửi yêu cầu đặt lại mật khẩu", resetToken });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi yêu cầu đặt lại mật khẩu", error });
        }
    }
}

module.exports = new AuthController();
