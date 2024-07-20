const { Sale,Product } = require('../../connection/connection.js');
const product = require('../../model/product.js');
const { Sequelize, Op} = require('sequelize');
const moment = require('moment');

const CreateSale = async (req, res) => {
    const { quantitySold, sellingPrice, salesDate, productId } = req.body;
  
    try {
      const initialProduct = await Product.findOne({ where: { id: productId } });
  
      if (!initialProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      const productName = initialProduct.name;
  
      if (initialProduct.quantity >= quantitySold) {
        const newSale = await Sale.create({
          quantitySold,
          sellingPrice,
          salesDate: salesDate || new Date(),
          productId
        });
  
        const newQuantity = initialProduct.quantity - quantitySold;
  
        await Product.update(
          { quantity: newQuantity },
          { where: { id: productId } }
        );
  
        return res.status(201).json({ sale: newSale, message: "Sale created successfully" });
      } else {
        const remainingQuantity = quantitySold - initialProduct.quantity;
        let totalAvailableQuantity = initialProduct.quantity;
        let productsToUpdate = [{ id: initialProduct.id, quantity: initialProduct.quantity }];
  
        const otherProducts = await Product.findAll({
          where: { name: productName, id: { [Sequelize.Op.ne]: productId } },
          order: [['quantity', 'DESC']]
        });
  
        for (let product of otherProducts) {
          if (totalAvailableQuantity >= quantitySold) break;
  
          totalAvailableQuantity += product.quantity;
          productsToUpdate.push({ id: product.id, quantity: product.quantity });
        }
  
        if (totalAvailableQuantity < quantitySold) {
          return res.status(400).json({ message: `Insufficient stock. Additional ${quantitySold - totalAvailableQuantity} units required.` });
        }
  
        const newSale = await Sale.create({
          quantitySold,
          sellingPrice,
          salesDate: salesDate || new Date(),
          productId
        });
  
        let quantityToDeduct = quantitySold;
        for (let product of productsToUpdate) {
          const newQuantity = Math.max(0, product.quantity - quantityToDeduct);
          quantityToDeduct -= product.quantity;
  
          await Product.update(
            { quantity: newQuantity },
            { where: { id: product.id } }
          );

        }
  
        return res.status(201).json({ sale: newSale, message: "Sale created successfully" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error creating sale", error: error.message });
    }
  };
  
const GetSale = async (req, res) => {
    try {
      const sales = await Sale.findAll(); 
      return res.status(200).json({ sales }); 
    } catch (error) {
      return res.status(500).json({ message: "Error fetching sale", error: error.message }); 
    }
  };

const GetSaleById = async (req, res) => {
    const { id, name } = req.query;
  
    try {
      let sales; 
      if (id && name) {
        const products = await Product.findAll({ where: { name: name } });
        if (products.length === 0) {
          return res.status(404).json({ message: "No products found for this name" });
        }
        const productIds = products.map(product => product.id);
        sales = await Sale.findAll({
          where: {
            id: id,
            productId: productIds
          }
        });
      } else if (name) {
        const products = await Product.findAll({ where: { name: name } });
        if (products.length === 0) {
          return res.status(404).json({ message: "No products found for this name" });
        }
        const productIds = products.map(product => product.id);
        sales = await Sale.findAll({ where: { productId: productIds } });
      } else if (id) {
        sales = await Sale.findAll({ where: { id: id } });
      } else {
        sales = await Sale.findAll();
      }
      if (sales.length > 0) {
        return res.status(200).json({ sales });
      } else {
        return res.status(404).json({ message: "No sale exists" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error fetching sales", error: error.message });
    }
  };


const ProductOverallSale = async (req, res) => {
  const name = req.query.name;

  try {
    let products;
    if (name) {
      products = await Product.findAll({ where: { name: name } });
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found for this name" });
      }
    } else {
      products = await Product.findAll();
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found" });
      }
    }

    const productIds = products.map(product => product.id);
    const sales = await Sale.findAll({ where: { productId: productIds } });

    if (sales.length > 0) {
      const salesByProductName = {};

      products.forEach(product => {
        if (!salesByProductName[product.name]) {
          salesByProductName[product.name] = {
            productName: product.name,
            sales: [],
            totalQuantitySold: 0
          };
        }
      });

      sales.forEach(sale => {
        const product = products.find(product => product.id === sale.productId);
        if (product) {
          salesByProductName[product.name].sales.push(sale);
          salesByProductName[product.name].totalQuantitySold += sale.quantitySold;
        }
      });

      const salesByProduct = Object.values(salesByProductName);

      return res.status(200).json({ salesByProduct });
    } else {
      return res.status(404).json({ message: "No sales found for these products" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sales", error: error.message });
  }
};

const Saleanalysis = async (req, res) => {
  const name = req.query.name;

  try {
    let products;
    if (name) {
      products = await Product.findAll({ where: { name: name } });
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found for this name" });
      }
    } else {
      products = await Product.findAll();
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found" });
      }
    }

    const productIds = products.map(product => product.id);

    const sales = await Sale.findAll({
      where: { productId: productIds },
      attributes: [
        [Sequelize.fn('to_char', Sequelize.col('salesDate'), 'YYYY-MM'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('quantitySold')), 'totalQuantitySold']
      ],
      group: ['month'],
      order: [['month', 'ASC']]
    });

    if (sales.length > 0) {
      return res.status(200).json({ monthlySales: sales });
    } else {
      return res.status(404).json({ message: "No sales found for these products" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sales", error: error.message });
  }
};

const SpecificSaleMontly = async (req, res) => {
  const { name, year } = req.query;

  if (!year || isNaN(year) || year.length !== 4) {
    return res.status(400).json({ message: "Invalid year provided. Please provide a valid year." });
  }

  try {
    let products;
    if (name) {
      products = await Product.findAll({ where: { name: name } });
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found for this name" });
      }
    } else {
      products = await Product.findAll();
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found" });
      }
    }

    const productIds = products.map(product => product.id);

    const sales = await Sale.findAll({
      where: {
        productId: productIds,
        salesDate: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`]
        }
      },
      attributes: [
        [Sequelize.fn('to_char', Sequelize.col('salesDate'), 'YYYY-MM'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('quantitySold')), 'totalQuantitySold']
      ],
      group: ['month'],
      order: [['month', 'ASC']]
    });

    const salesByMonth = sales.reduce((acc, sale) => {
      acc[sale.dataValues.month] = sale.dataValues.totalQuantitySold;
      return acc;
    }, {});

    const months = Array.from({ length: 12 }, (_, i) => moment({ year: parseInt(year), month: i }).format('YYYY-MM'));

    const monthlySales = months.map(month => ({
      month,
      totalQuantitySold: salesByMonth[month] || 0
    }));

    return res.status(200).json({ monthlySales });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sales", error: error.message });
  }
};


  module.exports = {
    GetSale ,
    GetSaleById,
    CreateSale ,
    ProductOverallSale,
    Saleanalysis,
    SpecificSaleMontly
  };