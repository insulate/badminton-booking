const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directories exist
const productUploadDir = path.join(__dirname, '../uploads/products');
const venueUploadDir = path.join(__dirname, '../uploads/venue');
const slipUploadDir = path.join(__dirname, '../uploads/slips');

if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true });
}

if (!fs.existsSync(venueUploadDir)) {
  fs.mkdirSync(venueUploadDir, { recursive: true });
}

if (!fs.existsSync(slipUploadDir)) {
  fs.mkdirSync(slipUploadDir, { recursive: true });
}

// Legacy alias for backward compatibility
const uploadDir = productUploadDir;

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

// Create multer instance for products
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Configure storage for venue images
const venueStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, venueUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, 'venue-' + uniqueSuffix + ext);
  },
});

// Create multer instance for venue images
const uploadVenue = multer({
  storage: venueStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Configure storage for payment slips
const slipStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, slipUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, 'slip-' + uniqueSuffix + ext);
  },
});

// Create multer instance for payment slips
const uploadSlip = multer({
  storage: slipStorage,
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

module.exports = { upload, uploadVenue, uploadSlip, deleteImage };
