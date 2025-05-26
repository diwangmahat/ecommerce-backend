const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Product = db.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  countInStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  numReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

Product.associate = function(models) {
  Product.hasMany(models.Review, {
    foreignKey: 'productId',
  });
};

module.exports = Product;
