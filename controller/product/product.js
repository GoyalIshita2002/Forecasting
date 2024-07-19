const { Product } = require('../../connection/connection.js');

const GetProduct = async (req, res) => {
    try {
      const products = await Product.findAll(); 
      return res.status(200).json({ products }); 
    } catch (error) {
      return res.status(500).json({ message: "Error fetching product", error: error.message }); 
    }
  };

  const GetProductById = async (req, res) => {
    const productId = req.params.id;
    try {
      const product = await Product.findOne({where:{id: productId}}); 
      if(product){
        return res.status(200).json({ product }); 
      }
      else{
        return res.status(200).json({message: "No product exists" }); 
      }
    } catch (error) {
      return res.status(500).json({ message: "Error fetching product", error: error.message }); 
    }
  };

  module.exports = {
    GetProduct,
    GetProductById
  };