const express = require('express');
const router = express.Router();
const Category = require('../models/category.model');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const categories = await Category.find(filter).sort({ order: 1, name: 1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบหมวดหมู่',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (Admin only)
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, label, icon, color, order, isActive } = req.body;

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'หมวดหมู่นี้มีอยู่แล้วในระบบ',
      });
    }

    const category = new Category({
      name,
      label,
      icon,
      color,
      order,
      isActive,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'สร้างหมวดหมู่สำเร็จ',
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Private (Admin only)
 */
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, label, icon, color, order, isActive } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบหมวดหมู่',
      });
    }

    // Check if new name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'ชื่อหมวดหมู่นี้มีอยู่แล้วในระบบ',
        });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (label) category.label = label;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'อัพเดทหมวดหมู่สำเร็จ',
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทหมวดหมู่',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบหมวดหมู่',
      });
    }

    // Check if there are products using this category
    const Product = require('../models/product.model');
    const productsWithCategory = await Product.countDocuments({ category: category.name });

    if (productsWithCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากมีสินค้า ${productsWithCategory} รายการที่ใช้หมวดหมู่นี้อยู่`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'ลบหมวดหมู่สำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่',
      error: error.message,
    });
  }
});

module.exports = router;
