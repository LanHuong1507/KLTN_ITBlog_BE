const multer = require('multer');
const path = require('path');

// Middleware để cấu hình multer cho việc upload file
const createUploader = (uploadFolder = 'uploads/') => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadFolder); // Lưu file vào thư mục truyền vào hoặc mặc định 'uploads/'
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    // Chỉ cho phép các loại file ảnh
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên các định dạng ảnh JPG, PNG, GIF, và WEBP'), false);
    }
  };

  return multer({ storage: storage, fileFilter: fileFilter });
};

module.exports = createUploader;
