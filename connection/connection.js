const { Sequelize } = require('sequelize');
const UserModel = require('../model/user.js');
const ProductModel = require('../model/product.js');
const SaleModel = require('../model/sale.js');

// const sequelize = new Sequelize('Forecast', 'johndoe', 'randompassword', {
//     host: 'localhost',
//     dialect: 'postgres'
//   });

let sequelize;
if (process.env.DB_URL) {
  sequelize = new Sequelize(process.env.DB_URL);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PW,
    {
      host: 'localhost',
      dialect: 'postgres',
    },
  );
}

  const User = UserModel(sequelize, Sequelize.DataTypes);
  const Product = ProductModel(sequelize,Sequelize.DataTypes);
  const Sale = SaleModel(sequelize,Sequelize.DataTypes);

  Product.hasMany(Sale, { foreignKey: 'productId' });
  Sale.belongsTo(Product, { foreignKey: 'productId' });
  
  const connectdb = async()=>{
    try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ alter: true });
    console.log('Models were synchronized successfully.');
      } 
    catch (error) {
    console.error('Unable to connect to the database:', error);
    } 
  }

  module.exports = {connectdb,sequelize,User,Product,Sale}