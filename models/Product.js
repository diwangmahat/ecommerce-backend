module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
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
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
    },
    brand: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    countInStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    size: {
      type: DataTypes.STRING,
    },
    color: {
      type: DataTypes.STRING,
    },
    gender: {
      type: DataTypes.STRING,
    },
    onSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    salePrice: {
      type: DataTypes.FLOAT,
    },
  });

  Product.associate = (models) => {
    Product.hasMany(models.OrderItems, {
      foreignKey: "productId",
    });
  };

  return Product;
};