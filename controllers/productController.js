const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { Product, Review } = require('../models');
const sequelize = require('../config/db');

// Input validation
const validateProduct = (productData) => {
  const { name, price, category, brand, countInStock, onSale, salePrice } = productData;
  if (!name || name.trim() === '') return 'Name is required';
  if (price == null || price < 0) return 'Price must be non-negative';
  if (!category || category.trim() === '') return 'Category is required';
  if (!brand || brand.trim() === '') return 'Brand is required';
  if (countInStock == null || countInStock < 0) return 'Stock must be non-negative';
  if (onSale && (salePrice == null || salePrice < 0 || salePrice >= price)) {
    return 'Sale price must be less than regular price and non-negative';
  }
  if (!onSale && salePrice != null) {
    return 'Sale price should be null when not on sale';
  }
  return null;
};

// @desc    Fetch all products with filters, search, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 32;
  const page = Number(req.query.pageNumber) || 1;
  const filters = {};

  // Keyword search
  if (req.query.keyword) {
    filters.name = { [Op.iLike]: `%${req.query.keyword}%` };
  }

  // Category filter
  if (req.query.category) {
    filters.category = req.query.category;
  }

  // Gender filter
  if (req.query.gender) {
    filters.gender = req.query.gender;
  }

  // Featured filter
  if (req.query.featured) {
    filters.featured = req.query.featured === 'true';
  }

  // Sale filter (onSale=true and salePrice is not null and less than price)
  if (req.query.onSale === 'true') {
    filters.onSale = true;
    filters.salePrice = { [Op.not]: null, [Op.lt]: sequelize.col('price') };
  }

  // New filter (created within last 7 days)
  if (req.query.isNew === 'true') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filters.createdAt = { [Op.gte]: sevenDaysAgo };
  }

  const count = await Product.count({ where: filters });
  const products = await Product.findAll({
    where: filters,
    limit: pageSize,
    offset: pageSize * (page - 1),
    order: [['createdAt', 'DESC']],
    attributes: {
      include: [
        [
          sequelize.literal(`(
            CASE
              WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN true
              ELSE false
            END
          )`),
          'isNew',
        ],
      ],
    },
  });

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    attributes: {
      include: [
        [
          sequelize.literal(`(
            CASE
              WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN true
              ELSE false
            END
          )`),
          'isNew',
        ],
      ],
    },
  });
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (product) {
    await product.destroy();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete all products
// @route   DELETE /api/products
// @access  Private/Admin
const deleteAllProducts = asyncHandler(async (req, res) => {
  const count = await Product.count();
  if (count === 0) {
    res.json({ message: 'No products to delete' });
    return;
  }
  await Product.destroy({ where: {}, truncate: false });
  res.json({ message: 'All products removed' });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name, price, image, brand, category, countInStock, description,
    featured, size, color, gender, onSale, salePrice,
  } = req.body;

  const error = validateProduct({ name, price, category, brand, countInStock, onSale, salePrice });
  if (error) {
    res.status(400);
    throw new Error(error);
  }

  const product = await Product.create({
    name,
    price,
    user: req.user.id,
    image: image || '',
    brand,
    category,
    countInStock,
    numReviews: 0,
    description: description || '',
    featured: featured || false,
    size: size || '',
    color: color || '',
    gender: gender || '',
    onSale: onSale || false,
    salePrice: salePrice || null,
  });

  res.status(201).json({
    ...product.toJSON(),
    isNew: product.isNew, // Include virtual field
  });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name, price, description, image, brand, category, countInStock,
    featured, size, color, gender, onSale, salePrice,
  } = req.body;

  const error = validateProduct({ name, price, category, brand, countInStock, onSale, salePrice });
  if (error) {
    res.status(400);
    throw new Error(error);
  }

  const product = await Product.findByPk(req.params.id);
  if (product) {
    product.name = name;
    product.price = price;
    product.description = description || '';
    product.image = image || '';
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;
    product.featured = featured || false;
    product.size = size || '';
    product.color = color || '';
    product.gender = gender || '';
    product.onSale = onSale || false;
    product.salePrice = salePrice || null;

    const updatedProduct = await product.save();
    res.json({
      ...updatedProduct.toJSON(),
      isNew: updatedProduct.isNew, // Include virtual field
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findByPk(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = await Review.findOne({
    where: { productId: req.params.id, userId: req.user.id },
  });
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Product already reviewed');
  }

  const review = await Review.create({
    rating: Number(rating),
    comment,
    productId: req.params.id,
    userId: req.user.id,
  });

  const reviews = await Review.findAll({ where: { productId: req.params.id } });
  product.numReviews = reviews.length;
  product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

  await product.save();
  res.status(201).json({ message: 'Review added' });
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    order: [['rating', 'DESC']],
    limit: 3,
    attributes: {
      include: [
        [
          sequelize.literal(`(
            CASE
              WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN true
              ELSE false
            END
          )`),
          'isNew',
        ],
      ],
    },
  });
  res.json(products);
});

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private/Admin
const getProductStats = asyncHandler(async (req, res) => {
  const totalProducts = await Product.count();
  const outOfStock = await Product.count({ where: { countInStock: 0 } });
  const onSaleCount = await Product.count({ 
    where: { 
      onSale: true,
      salePrice: { [Op.not]: null, [Op.lt]: sequelize.col('price') }
    }
  });
  const newCount = await Product.count({
    where: {
      createdAt: { [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7)) },
    },
  });
  const categories = await Product.findAll({
    attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['category'],
  });
  const lowStock = await Product.count({
    where: { countInStock: { [Op.and]: [{ [Op.lt]: 10 }, { [Op.gt]: 0 }] } },
  });

  res.json({ totalProducts, outOfStock, lowStock, onSaleCount, newCount, categories });
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  deleteAllProducts,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getProductStats,
};