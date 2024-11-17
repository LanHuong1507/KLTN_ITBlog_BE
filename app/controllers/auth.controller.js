const User = require("../models/user.model.js");
const PasswordReset = require("../models/password_reset.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op, where } = require("sequelize");
const nodemailer = require("nodemailer");

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
    async refreshToken(req, res) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Vui lòng cung cấp refresh token" });
        }

        try {
            
            const decoded = jwt.verify(refreshToken, JWT_SECRET);

            const user = await User.findOne({
                where: {
                  user_id: decoded.userId
                }
            });

            if(!user) return res.status(400).json({ message: "Tài khoản không tồn tại", error }); 

            if(user.role == "blocked") return res.status(400).json({ message: "Tài khoản bị cấm khỏi hệ thống", error }); 

            const newToken = jwt.sign({ userId: decoded.userId, role: decoded.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            return res.status(200).json({ token: newToken });
        } catch (error) {
            return res.status(400).json({ message: "Refresh token không hợp lệ", error });
        }
    }
    async passwordReset(req, res) {
        const { email } = req.body;

        try {
            if (!email) {
                return res.status(400).json({ message: "Email không được để trống" });
            }
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
            }
            const resetToken = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 3600000); 
            user.password_reset_token = resetToken;
            user.password_reset_expires = expiresAt;
            await user.save();
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "vanbac21112k2@gmail.com",
                    pass: "mtsm ucvo xmjd xsln" 
                },
                tls: {
                    rejectUnauthorized: false, 
                }
            });
            const resetUrl = `http://127.0.0.1:3000/doi-mat-khau/?token=${resetToken}`;

            // Nội dung email
            const mailOptions = {
                from: '"[Blog Tech] Đổi Mật Khẩu" <blogtech@gmail.com>', // Thay bằng email của bạn
                to: email,
                subject: "Yêu cầu đặt lại mật khẩu",
                html: `
                    <h2>Yêu cầu đặt lại mật khẩu</h2>
                    <p>Nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn:</p>
                    <a href="${resetUrl}" target="_blank">${resetUrl}</a>
                    <p>Liên kết sẽ hết hạn sau 1 giờ.</p>
                `
            };

            // Gửi email
            await transporter.sendMail(mailOptions);

            return res.status(200).json({ message: "Đã gửi yêu cầu đặt lại mật khẩu qua email." });
        } catch (error) {
            console.error("Lỗi yêu cầu đặt lại mật khẩu:", error);
            return res.status(500).json({ message: "Lỗi yêu cầu đặt lại mật khẩu", error });
        }
    }

    // [POST] /reset-password
    async resetPassword(req, res) {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Yêu cầu đổi mật khẩu không hợp lệ" });
        }

        if (!newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập mật khẩu cần đổi" });
        }

        // Tìm user theo token và kiểm tra thời gian hết hạn
        const user = await User.findOne({
            where: {
                password_reset_token: token,
                password_reset_expires: { [Op.gt]: new Date() } // Token còn hiệu lực
            }
        });

        if (!user) {
            return res.status(400).json({ message: "Yêu cầu đổi mật khẩu không hợp lệ hoặc đã hết hạn." });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu và xóa token
        user.password_hash = hashedPassword;
        user.password_reset_token = null;
        user.password_reset_expires = null;
        await user.save();

        return res.status(200).json({ message: "Đặt lại mật khẩu thành công." });

    }
}

module.exports = new AuthController();
