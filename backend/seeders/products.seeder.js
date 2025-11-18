const mongoose = require('mongoose');
const Product = require('../models/product.model');
require('dotenv').config();

const products = [
  // Shuttlecocks
  {
    sku: 'SHT001',
    name: 'ลูกขนไก่ Yonex AS-50',
    category: 'shuttlecock',
    price: 450,
    stock: 50,
    lowStockAlert: 10,
    status: 'active',
  },
  {
    sku: 'SHT002',
    name: 'ลูกขนไก่ Victor Master Ace',
    category: 'shuttlecock',
    price: 500,
    stock: 30,
    lowStockAlert: 10,
    status: 'active',
  },
  {
    sku: 'SHT003',
    name: 'ลูกขนไก่ RSL Classic Tourney',
    category: 'shuttlecock',
    price: 420,
    stock: 40,
    lowStockAlert: 10,
    status: 'active',
  },

  // Beverages
  {
    sku: 'BEV001',
    name: 'น้ำเปล่า',
    category: 'beverage',
    price: 10,
    stock: 100,
    lowStockAlert: 20,
    status: 'active',
  },
  {
    sku: 'BEV002',
    name: 'น้ำกระทิงแดง',
    category: 'beverage',
    price: 20,
    stock: 80,
    lowStockAlert: 15,
    status: 'active',
  },
  {
    sku: 'BEV003',
    name: 'โพคารี่สเวท',
    category: 'beverage',
    price: 25,
    stock: 60,
    lowStockAlert: 15,
    status: 'active',
  },
  {
    sku: 'BEV004',
    name: 'น้ำผลไม้',
    category: 'beverage',
    price: 30,
    stock: 50,
    lowStockAlert: 15,
    status: 'active',
  },
  {
    sku: 'BEV005',
    name: 'กาแฟเย็น',
    category: 'beverage',
    price: 35,
    stock: 40,
    lowStockAlert: 10,
    status: 'active',
  },

  // Snacks
  {
    sku: 'SNK001',
    name: 'ขนมปัง',
    category: 'snack',
    price: 15,
    stock: 50,
    lowStockAlert: 10,
    status: 'active',
  },
  {
    sku: 'SNK002',
    name: 'มาม่า',
    category: 'snack',
    price: 12,
    stock: 60,
    lowStockAlert: 15,
    status: 'active',
  },
  {
    sku: 'SNK003',
    name: 'ลูกอม',
    category: 'snack',
    price: 5,
    stock: 100,
    lowStockAlert: 20,
    status: 'active',
  },
  {
    sku: 'SNK004',
    name: 'ช็อกโกแลต',
    category: 'snack',
    price: 20,
    stock: 40,
    lowStockAlert: 10,
    status: 'active',
  },
  {
    sku: 'SNK005',
    name: 'เค้กบาร์',
    category: 'snack',
    price: 25,
    stock: 30,
    lowStockAlert: 10,
    status: 'active',
  },

  // Equipment
  {
    sku: 'EQP001',
    name: 'ผ้าเช็ดหน้า',
    category: 'equipment',
    price: 50,
    stock: 40,
    lowStockAlert: 10,
    status: 'active',
  },
  {
    sku: 'EQP002',
    name: 'ปลอกข้อมือ',
    category: 'equipment',
    price: 80,
    stock: 25,
    lowStockAlert: 5,
    status: 'active',
  },
  {
    sku: 'EQP003',
    name: 'สายรัดแร็กเก็ต',
    category: 'equipment',
    price: 30,
    stock: 35,
    lowStockAlert: 10,
    status: 'active',
  },
  {
    sku: 'EQP004',
    name: 'ถุงมือ',
    category: 'equipment',
    price: 120,
    stock: 20,
    lowStockAlert: 5,
    status: 'active',
  },
  {
    sku: 'EQP005',
    name: 'แผ่นรองเท้า',
    category: 'equipment',
    price: 150,
    stock: 15,
    lowStockAlert: 5,
    status: 'active',
  },
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/badminton-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert products
    const createdProducts = await Product.create(products);
    console.log(`Created ${createdProducts.length} products successfully`);

    // Display created products by category
    const categories = ['shuttlecock', 'beverage', 'snack', 'equipment'];

    categories.forEach((category) => {
      const categoryProducts = createdProducts.filter(p => p.category === category);
      console.log(`\n${category.toUpperCase()} (${categoryProducts.length} items):`);
      categoryProducts.forEach((product) => {
        console.log(`- ${product.sku}: ${product.name} (฿${product.price})`);
      });
    });

    console.log('\n✅ Product seeding completed!');
    console.log(`\nTotal products: ${createdProducts.length}`);
    console.log('Categories: Shuttlecock, Beverage, Snack, Equipment');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
