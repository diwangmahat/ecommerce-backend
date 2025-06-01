const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = require('../config/db');
const models = {};

console.log('Loading models from:', __dirname);

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach((file) => {
    try {
      const model = require(path.join(__dirname, file))(db, Sequelize.DataTypes);
      models[model.name] = model;
      console.log(`Loaded model: ${model.name}`);
    } catch (error) {
      console.error(`Error loading model from ${file}:`, error);
    }
  });

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    try {
      models[modelName].associate(models);
    } catch (error) {
      console.error(`Error associating model ${modelName}:`, error);
    }
  }
});

models.sequelize = db;
models.Sequelize = Sequelize;

module.exports = models;