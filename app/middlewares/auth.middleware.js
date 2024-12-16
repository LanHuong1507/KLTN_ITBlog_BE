const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_jwt_secret"; // Sử dụng cùng giá trị bí mật như trong UserController

// Middleware để xác thực người dùng
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null)
    return res.status(401).json({ message: "Yêu cầu đăng nhập." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Yêu cầu đăng nhập." });
    req.user = user;
    next();
  });
}

function authenticateTokenNotRequired(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Nếu không có token, tiếp tục xử lý mà không cần xác thực
  if (!token) {
    req.user = null; // Không có user trong request
    return next();
  }

  // Nếu có token, xác thực nó
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null; // Token không hợp lệ thì bỏ qua user
    } else {
      req.user = user; // Gắn thông tin user vào request nếu xác thực thành công
    }
    next(); // Tiếp tục xử lý request
  });
}

// Middleware để kiểm tra vai trò admin
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({
        message: 'Vui lòng đăng nhập tài khoản "Quản trị viên" để thực hiện.',
      });
  }
  next();
}

// Middleware để kiểm tra vai trò user
function requireCustomer(req, res, next) {
  if (req.user.role !== "user") {
    return res
      .status(403)
      .json({
        message: 'Vui lòng đăng nhập tài khoản "Người dùng" để thực hiện.',
      });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCustomer,
  authenticateTokenNotRequired,
};
