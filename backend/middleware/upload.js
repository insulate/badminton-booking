const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename using crypto for security
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  },
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Helper function to delete old image file
const deleteImage = async (imagePath) => {
  if (!imagePath) {
    return;
  }

  try {
    // Validate that path starts with /uploads to prevent path traversal
    if (!imagePath.startsWith('/uploads/')) {
      console.error('Invalid image path - must start with /uploads/:', imagePath);
      return;
    }

    // Normalize path to prevent path traversal attacks
    const normalizedPath = path.normalize(imagePath);
    if (normalizedPath.includes('..')) {
      console.error('Path traversal attempt detected:', imagePath);
      return;
    }

    const fullPath = path.join(__dirname, '../', normalizedPath);

    // Check if file exists
    if (fs.existsSync(fullPath)) {
      // Use async unlink with promises
      await fs.promises.unlink(fullPath);
      console.log('Image deleted successfully:', imagePath);
    }
  } catch (error) {
    // Log error but don't throw - file deletion failure shouldn't crash the server
    console.error('Error deleting image:', imagePath, error.message);
  }
};

module.exports = { upload, deleteImage };
