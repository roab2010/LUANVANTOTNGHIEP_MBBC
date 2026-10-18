const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage to inspect buffer and compute hash before Cloudinary upload
const storage = multer.memoryStorage();

// File filter for backend validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ các định dạng: JPG, JPEG, PNG, WEBP'), false);
  }
};

// Multer upload middleware (5MB limit)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Helper to stream upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'sellstock/products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };

