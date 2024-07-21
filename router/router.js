const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const authenticateToken = require('../middleware/authenticateToken.js');
const { processCSV } = require('../services/csvprocessor.js');

const { CreateUser, GetUser, GetUserById, SigninUser } = require('../controller/user/user.js');
const {GetProduct,GetProductByIdOrName ,StockProduct} = require('../controller/product/product.js');
const {GetSale,GetSaleById ,CreateSale,ProductOverallSale,Saleanalysis,SpecificSaleMontly} = require('../controller/sale/sales.js');
const {TotalInventory} = require('../controller/sale/inventory.js');
const {returnrisk} = require('../controller/Anaylises/returnrisk.js')
const {SpecificSaleyearly,SpecificSaleWeekly } = require('../controller/sale/timeanalysis.js')

router.post('/users', CreateUser);
router.post('/signin', SigninUser);
router.get('/users', GetUser);

router.use(authenticateToken);
router.get('/user', GetUserById);
router.get('/products', GetProduct);
router.get('/product', GetProductByIdOrName);
router.get('/stock', StockProduct);
router.get('/sales', GetSale);
router.get('/salename', ProductOverallSale);
router.get('/saleanalysis', Saleanalysis);
router.get('/salemonthly', SpecificSaleMontly);
router.get('/sale', GetSaleById);
router.post('/sale',CreateSale);
router.get('/inventory', TotalInventory);
router.get('/returnrisk', returnrisk);
router.get('/saleyearly', SpecificSaleyearly);
router.get('/saleweekly', SpecificSaleWeekly );



router.post('/upload-csv', upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }
  const filePath = req.file.path;
  processCSV(filePath)
    .then(() => res.send('File has been processed and data stored.'))
    .catch(error => {
      console.error('Error processing file', error);
      res.status(500).send('Error processing file');
    });
});

module.exports = router;
