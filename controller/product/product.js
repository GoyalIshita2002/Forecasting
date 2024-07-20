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
    const { name } = req.query; 
    try {
      const products = await Product.findAll({ where: { name: name } });
      let qty = 0;
      
      if (products.length > 0) {
        products.forEach(product => {
          qty += product.quantity; 
        });
        return res.status(200).json({ products, totalQuantity: qty });
      } else {
        return res.status(200).json({ message: "No product exists" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error fetching product", error: error.message });
    }
  };
  
  module.exports = {
    GetProduct,
    GetProductByIdOrName,
    StockProduct
  };