const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const Product = require('../models/Product');
const Review = require('../models/Review');
// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 32;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          [Op.iLike]: `%${req.query.keyword}%`
        }
      }
    : {};

  const count = await Product.count({ where: keyword });
  const products = await Product.findAll({
    where: keyword,
    limit: pageSize,
    offset: pageSize * (page - 1),
    order: [['createdAt', 'DESC']]
  });

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

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

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    image, // Cloudinary URL
    brand,
    category,
    countInStock,
    description
  } = req.body;

  const product = await Product.create({
    name,
    price,
    user: req.user.id,
    image, // ← store Cloudinary image URL here
    brand,
    category,
    countInStock,
    numReviews: 0,
    description
  });

  res.status(201).json(product);
});


// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    brand,
    category,
    countInStock
  } = req.body;

  const product = await Product.findByPk(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
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

  if (product) {
    const alreadyReviewed = await Review.findOne({
      where: {
        productId: req.params.id,
        userId: req.user.id
      }
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = await Review.create({
      rating: Number(rating),
      comment,
      productId: req.params.id,
      userId: req.user.id
    });

    const reviews = await Review.findAll({
      where: { productId: req.params.id }
    });

    product.numReviews = reviews.length;
    product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await product.save();

    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});


// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    order: [['rating', 'DESC']],
    limit: 3
  });

  res.json(products);
});

const getProductStats = asyncHandler(async (req, res) => {
  const totalProducts = await Product.count();
  const outOfStock = await Product.count({ where: { countInStock: 0 } });
  
  const categories = await Product.findAll({
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['category']
  });
  
  const lowStock = await Product.count({
    where: {
      countInStock: { [Op.lt]: 10 },
      countInStock: { [Op.gt]: 0 }
    }
  });
  
  res.json({ 
    totalProducts, 
    outOfStock, 
    lowStock,
    categories 
  });
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getProductStats
};