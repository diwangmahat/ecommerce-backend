const sequelize = require('../backend/config/db');
const Product = require('../backend/models/Product');
const User = require('../backend/models/User'); // 👈 Import User model
const bcrypt = require('bcrypt');
require('dotenv').config();

// Sample Admin User
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin@123', // Will be hashed
  role: 'admin',
};

const sampleProducts = [
  // MEN - Shirts
  { 
    name: 'Men Shirt 1',
    description: 'good product',
    category: 'Shirts',
    gender: 'Men',
    brand: 'Zara',
    price: 39.99,
    featured:true,
    countInStock: 10,
    image: '/images/men-shirt1.jpg',
  },
  {    
    name: 'Men Shirt 2',
    description: 'good product',
    category: 'Shirts',
    gender: 'Men',
    brand: 'H&M',
    price: 34.99,
    countInStock: 8,
    image: '/images/men-shirt2.jpg',
  },
  {    name: 'Men Shirt 3',
    description: 'good product',
    category: 'Shirts',
    gender: 'Men',
    brand: 'Kohl',
    price: 29.99,
    countInStock: 9,
    image: '/images/men-shirt3.jpg',
  },
  {    name: 'Men Shirt 4',
    description: 'good product',
    category: 'Shirts',
    gender: 'Men',
    brand: 'Levi\'s',
    price: 44.99,
    countInStock: 6,
    image: '/images/men-shirt4.jpg',
  },
  {    name: 'Men Shirt 5',
    description: 'good product',
    category: 'Shirts',
    gender: 'Men',
    brand: 'Jack & Jones',
    price: 36.99,
    countInStock: 7,
    image: '/images/men-shirt5.jpg',
  },
  {    name: 'Men Shirt 6',
    description: 'good product',
    category: 'Shirts',
    gender: 'Men',
    brand: 'Allen Solly',
    price: 42.99,
    countInStock: 10,
    image: '/images/men-shirt6.jpg',
  },

  // MEN - T-Shirts
  {    name: 'Men T-Shirt 1',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Men',
    brand: 'Nike',
    price: 29.99,
    countInStock: 12,
    image: '/images/men-tshirt1.jpg',
  },
  {    name: 'Men T-Shirt 2',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Men',
    brand: 'Adidas',
    price: 32.99,
    countInStock: 14,
    image: '/images/men-tshirt2.jpg',
  },
  {    name: 'Men T-Shirt 3',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Men',
    brand: 'Puma',
    price: 24.99,
    countInStock: 9,
    image: '/images/men-tshirt3.jpg',
  },
  {
    name: 'Men T-Shirt 4',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Men',
    brand: 'Reebok',
    price: 26.99,
    countInStock: 11,
    image: '/images/men-tshirt4.jpg',
  },
  {
    name: 'Men T-Shirt 5',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Men',
    brand: 'Levi\'s',
    price: 28.99,
    countInStock: 10,
    image: '/images/men-tshirt5.jpg',
  },
  {
    name: 'Men T-Shirt 6',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Men',
    brand: 'Tommy Hilfiger',
    price: 35.99,
    countInStock: 8,
    image: '/images/men-tshirt6.jpg',
  },

  // MEN - Pants
  {
    name: 'Men Pants 1',
    description: 'good product',
    category: 'Pants',
    gender: 'Men',
    brand: 'Levi\'s',
    price: 49.99,
    countInStock: 10,
    image: '/images/men-pants1.jpg',
  },
  {
    name: 'Men Pants 2',
    description: 'good product',
    category: 'Pants',
    gender: 'Men',
    brand: 'Zara',
    price: 54.99,
    countInStock: 6,
    image: '/images/men-pants2.jpg',
  },
  {
    name: 'Men Pants 3',
    description: 'good product',
    category: 'Pants',
    gender: 'Men',
    brand: 'H&M',
    price: 44.99,
    countInStock: 7,
    image: '/images/men-pants3.jpg',
  },

  {
    name: 'Men Pants 5',
    description: 'good product',
    category: 'Pants',
    gender: 'Men',
    brand: 'Wrangler',
    price: 39.99,
    countInStock: 10,
    image: '/images/men-pants4.jpg',
  },
  
  // MEN - Shoes
  {
    name: 'Men Shoes 1',
    description: 'good product',
    category: 'Shoes',
    gender: 'Men',
    brand: 'Nike',
    price: 79.99,
    featured:true,
    countInStock: 15,
    image: '/images/men-shoes1.jpg',
  },
  {
    name: 'Men Shoes 2',
    description: 'good product',
    category: 'Shoes',
    gender: 'Men',
    brand: 'Adidas',
    price: 84.99,
    countInStock: 10,
    image: '/images/men-shoes2.jpg',
  },
 
  {
    name: 'Men Shoes 5',
    description: 'good product',
    category: 'Shoes',
    gender: 'Men',
    brand: 'Woodland',
    price: 89.99,
    countInStock: 8,
    image: '/images/men-shoes3.jpg',
  },

  // WOMEN - Shirts
  {
    name: 'Women Shirt 1',
    description: 'good product',
    category: 'Shirts',
    gender: 'Women',
    brand: 'Zara',
    price: 39.99,
    countInStock: 10,
    image: '/images/women-shirt1.jpg',
  },
  {
    name: 'Women Shirt 2',
    description: 'good product',
    category: 'Shirts',
    gender: 'Women',
    brand: 'H&M',
    price: 34.99,
    countInStock: 8,
    image: '/images/women-shirt2.jpg',
  },
  {
    name: 'Women Shirt 3',
    description: 'good product',
    category: 'Shirts',
    gender: 'Women',
    brand: 'Levi\'s',
    price: 44.99,
    featured:true,
    countInStock: 6,
    image: '/images/women-shirt3.jpg',
  },
 
  // WOMEN - T-Shirts
  {
    name: 'Women T-Shirt 1',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Women',
    brand: 'Nike',
    price: 29.99,
    countInStock: 12,
    image: '/images/women-tshirt1.jpg',
  },
  {
    name: 'Women T-Shirt 2',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Women',
    brand: 'Adidas',
    price: 32.99,
    countInStock: 14,
    image: '/images/women-tshirt2.jpg',
  },
  {
    name: 'Women T-Shirt 3',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Women',
    brand: 'zara',
    price: 24.99,
    countInStock: 9,
    image: '/images/women-tshirt3.jpg',
  },
  {
    name: 'Women T-Shirt 4',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Women',
    brand: 'H&m',
    price: 26.99,
    countInStock: 11,
    image: '/images/women-tshirt4.jpg',
  },
  {
    name: 'Women T-Shirt 5',
    description: 'good product',
    category: 'T-Shirts',
    gender: 'Women',
    brand: 'Levi\'s',
    price: 28.99,
    countInStock: 10,
    image: '/images/women-tshirt5.jpg',
  },

  // WOMEN - Pants
  {
    name: 'Women Pants 1',
    description: 'good product',
    category: 'Pants',
    gender: 'Women',
    brand: 'Levi\'s',
    price: 49.99,
    countInStock: 10,
    image: '/images/women-pants1.jpg',
  },
  {
    name: 'Women Pants 2',
    description: 'good product',
    category: 'Pants',
    gender: 'Women',
    brand: 'Zara',
    price: 54.99,
    countInStock: 6,
    image: '/images/women-pants2.jpg',
  },
  {
    name: 'Women Pants 3',
    description: 'good product',
    category: 'Pants',
    gender: 'Women',
    brand: 'H&M',
    price: 44.99,
    countInStock: 7,
    image: '/images/women-pants3.jpg',
  },
  {
    name: 'Women Pants 4',
    description: 'good product',
    category: 'Pants',
    gender: 'Women',
    brand: 'Allen Solly',
    price: 48.99,
    countInStock: 8,
    image: '/images/women-pants4.jpg',
  },
];

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Drops and recreates tables

    const createdAdmin = await User.create(adminUser);
    console.log('Admin user created:', createdAdmin.email);

    // Seed products
    await Product.bulkCreate(sampleProducts);
    console.log('Products imported to PostgreSQL!');

    process.exit();
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};


seedDatabase();