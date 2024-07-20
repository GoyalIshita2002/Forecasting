const { Product } = require('../../connection/connection.js');

const GetProduct = async (req, res) => {
    try {
      const products = await Product.findAll(); 
      return res.status(200).json({ products }); 
    } catch (error) {
      return res.status(500).json({ message: "Error fetching product", error: error.message }); 
    }
  };

  const GetProductByIdOrName = async (req, res) => {
    const { id, name } = req.query; 
    try {
      let query = {};
      if (id) query.id = id;
      if (name) query.name = name;
  
      const product = await Product.findAll({ where: query });
  
      if (product) {
        return res.status(200).json({ product });
      } else {
        return res.status(200).json({ message: "No product exists" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error fetching product", error: error.message });
    }
  };

  const StockProduct = async (req, res) => {
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
  
      const totalQuantities = {};
  
      products.forEach(product => {
        if (!totalQuantities[product.name]) {
          totalQuantities[product.name] = {
            productName: product.name,
            products: [],
            totalQuantity: 0
          };
        }
        totalQuantities[product.name].products.push(product);
        totalQuantities[product.name].totalQuantity += product.quantity;
      });
  
      const stockByProduct = Object.values(totalQuantities);
  
      return res.status(200).json({ stockByProduct });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching product", error: error.message });
    }
  };

  
  
  
  module.exports = {
    GetProduct,
    GetProductByIdOrName,
    StockProduct
  };