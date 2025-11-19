const mongoose = require('mongoose');
const Product = require('../models/product.model');
require('dotenv').config();

// Helper function to create SVG placeholder as data URL
const createPlaceholder = (color, text) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="400" height="400" fill="${color}"/>
    <text x="50%" y="50%" font-size="32" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
};

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
    imageUrl: createPlaceholder('#4A90E2', 'Yonex AS-50'),
  },
  {
    sku: 'SHT002',
    name: 'ลูกขนไก่ Victor Master Ace',
    category: 'shuttlecock',
    price: 500,
    stock: 30,
    lowStockAlert: 10,
    status: 'active',
    imageUrl: createPlaceholder('#E24A4A', 'Victor Master'),
  },
  {
    sku: 'SHT003',
    name: 'ลูกขนไก่ RSL Classic Tourney',
    category: 'shuttlecock',
    price: 420,
    stock: 40,
    lowStockAlert: 10,
    status: 'active',
    imageUrl: createPlaceholder('#50C878', 'RSL Classic'),
  },
  {
    sku: 'SHT004',
    name: 'ลูกขนไก่ VICTOR CHAMPION NO.1',
    category: 'shuttlecock',
    price: 80,
    stock: 60,
    lowStockAlert: 15,
    status: 'active',
    imageUrl: createPlaceholder('#E24A4A', 'VICTOR CHAMPION'),
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
    imageUrl: createPlaceholder('#3498DB', 'Water'),
  },
  {
    sku: 'BEV002',
    name: 'น้ำกระทิงแดง',
    category: 'beverage',
    price: 20,
    stock: 80,
    lowStockAlert: 15,
    status: 'active',
    imageUrl: createPlaceholder('#E74C3C', 'Red Bull'),
  },
  {
    sku: 'BEV003',
    name: 'โพคารี่สเวท',
    category: 'beverage',
    price: 25,
    stock: 60,
    lowStockAlert: 15,
    status: 'active',
    imageUrl: createPlaceholder('#3498DB', 'Pocari'),
  },
  {
    sku: 'BEV004',
    name: 'น้ำผลไม้',
    category: 'beverage',
    price: 30,
    stock: 50,
    lowStockAlert: 15,
    status: 'active',
    imageUrl: createPlaceholder('#F39C12', 'Juice'),
  },
  {
    sku: 'BEV005',
    name: 'กาแฟเย็น',
    category: 'beverage',
    price: 35,
    stock: 40,
    lowStockAlert: 10,
    status: 'active',
    imageUrl: createPlaceholder('#6F4E37', 'Coffee'),
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
    imageUrl: createPlaceholder('#F4A460', 'Bread'),
  },
  {
    sku: 'SNK002',
    name: 'มาม่า',
    category: 'snack',
    price: 12,
    stock: 60,
    lowStockAlert: 15,
    status: 'active',
    imageUrl: createPlaceholder('#FFD700', 'Mama'),
  },
  {
    sku: 'SNK003',
    name: 'ลูกอม',
    category: 'snack',
    price: 5,
    stock: 100,
    lowStockAlert: 20,
    status: 'active',
    imageUrl: createPlaceholder('#FF69B4', 'Candy'),
  },
  {
    sku: 'SNK004',
    name: 'ช็อกโกแลต',
    category: 'snack',
    price: 20,
    stock: 40,
    lowStockAlert: 10,
    status: 'active',
    imageUrl: createPlaceholder('#8B4513', 'Chocolate'),
  },
  {
    sku: 'SNK005',
    name: 'เค้กบาร์',
    category: 'snack',
    price: 25,
    stock: 30,
    lowStockAlert: 10,
    status: 'active',
    imageUrl: createPlaceholder('#DDA0DD', 'Cake Bar'),
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
    imageUrl: createPlaceholder('#87CEEB', 'Towel'),
  },
  {
    sku: 'EQP002',
    name: 'ปลอกข้อมือ',
    category: 'equipment',
    price: 80,
    stock: 25,
    lowStockAlert: 5,
    status: 'active',
    imageUrl: createPlaceholder('#9370DB', 'Wristband'),
  },
  {
    sku: 'EQP003',
    name: 'สายรัดแร็กเก็ต',
    category: 'equipment',
    price: 30,
    stock: 35,
    lowStockAlert: 10,
    status: 'active',
    imageUrl: createPlaceholder('#20B2AA', 'Grip'),
  },
  {
    sku: 'EQP004',
    name: 'ถุงมือ',
    category: 'equipment',
    price: 120,
    stock: 20,
    lowStockAlert: 5,
    status: 'active',
    imageUrl: createPlaceholder('#696969', 'Gloves'),
  },
  {
    sku: 'EQP005',
    name: 'แผ่นรองเท้า',
    category: 'equipment',
    price: 150,
    stock: 15,
    lowStockAlert: 5,
    status: 'active',
    imageUrl: createPlaceholder('#4682B4', 'Insole'),
  },
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/badminton-system');
    console.log('✅ MongoDB Connected');

    // Clear existing products
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    // Prepare product data with image URLs
    const productsWithImages = products.map((product) => {
      if (product.imageUrl) {
        return {
          ...product,
          image: product.imageUrl, // Use URL directly
          imageUrl: undefined, // Remove imageUrl from final data
        };
      }
      return product;
    });

    // Insert products
    const createdProducts = await Product.create(productsWithImages);
    console.log(`\n✅ Created ${createdProducts.length} products successfully`);

    // Display created products by category
    const categories = ['shuttlecock', 'beverage', 'snack', 'equipment'];

    categories.forEach((category) => {
      const categoryProducts = createdProducts.filter(p => p.category === category);
      console.log(`\n${category.toUpperCase()} (${categoryProducts.length} items):`);
      categoryProducts.forEach((product) => {
        const imageStatus = product.image ? '🖼️' : '❌';
        console.log(`${imageStatus} ${product.sku}: ${product.name} (฿${product.price})`);
      });
    });

    console.log('\n✅ Product seeding completed!');
    console.log(`\nTotal products: ${createdProducts.length}`);
    console.log(`Products with images: ${createdProducts.filter(p => p.image).length}`);
    console.log('Categories: Shuttlecock, Beverage, Snack, Equipment');
    console.log('\n💡 Note: Images are using SVG placeholders as base64 data URLs');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
