// models/Product.js
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    countInStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    numReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    size: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    onSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    salePrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        isValidSalePrice(value) {
          if (this.onSale && (value == null || value >= this.price)) {
            throw new Error('Sale price must be less than regular price when on sale');
          }
          if (!this.onSale && value != null) {
            throw new Error('Sale price should be null when not on sale');
          }
        },
      },
    },
    isNew: {
      type: DataTypes.VIRTUAL,
      get() {
        const createdAt = this.getDataValue('createdAt');
        if (!createdAt) return false;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return createdAt >= sevenDaysAgo;
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  Product.associate = function (models) {
    Product.hasMany(models.Review, {
      foreignKey: 'productId',
      onDelete: 'CASCADE',
    });
    Product.hasMany(models.OrderItems, {
      foreignKey: 'productId',
      as: 'orderItems',
    });
    Product.belongsTo(models.User, {
      foreignKey: 'user',
      as: 'admin',
    });
  };

  return Product;
};