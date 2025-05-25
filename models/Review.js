const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Review = db.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
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

// Define associations
Review.associate = function(models) {
  Review.belongsTo(models.Product, {
    foreignKey: 'productId',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(models.User, {
    foreignKey: 'userId',
    onDelete: 'SET NULL'
  });
};

module.exports = Review;