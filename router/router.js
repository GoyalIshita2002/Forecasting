const express = require('express');
const router = express.Router();
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
const authenticateToken = require('../middleware/authenticateToken.js');
const { processCSV } = require('../services/csvprocessor.js');

const { CreateUser, GetUser, GetUserById, SigninUser } = require('../controller/user/user.js');
const { GetProduct, GetProductByIdOrName, StockProduct } = require('../controller/product/product.js');
const { GetSale, GetSaleById, CreateSale, ProductOverallSale, Saleanalysis, SpecificSaleMontly } = require('../controller/sale/sales.js');
const { TotalInventory } = require('../controller/sale/inventory.js');
const { returnrisk } = require('../controller/Anaylises/returnrisk.js');
const { SpecificSaleyearly, SpecificSaleWeekly } = require('../controller/sale/timeanalysis.js');
const { predictOutOfStockDate, demandOnSpecificDate, singleProductDemand, stockRequirementOnDate, seasonalForecasting, Forecastingoption } = require('../controller/Forecastdemand/demand.js');
const {getForecastData,getForecastProfitPlot,getForecastUnitsSoldPlot} = require('../controller/Forecastdemand/forecast.js')

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
router.post('/sale', CreateSale);
router.get('/inventory', TotalInventory);
router.get('/returnrisk', returnrisk);
router.get('/saleyearly', SpecificSaleyearly);
router.get('/saleweekly', SpecificSaleWeekly);
router.get('/predict-out-of-stock/:productId', predictOutOfStockDate);
router.get('/demand', demandOnSpecificDate);
router.get('/products/:productId/demand', singleProductDemand);
router.get('/products/:productId/stock-requirement', stockRequirementOnDate);
router.get('/forecast-data', getForecastData);
router.get('/forecast-profit-plot', getForecastProfitPlot);
router.get('/forecast-units-sold-plot', getForecastUnitsSoldPlot);



router.post('/upload-csv', upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }
  const filePath = req.file.path;

  processCSV(filePath)
    .then(() => {
      const pythonScriptPath = path.join(__dirname, '../scripts/forecast.py');
      exec(`python3 ${pythonScriptPath} ${filePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).send('Error running Python script.');
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return res.status(500).send('Error in Python script.');
        }
        fs.unlinkSync(filePath);
        res.send('File has been processed and data stored.');
      });
    })
    .catch(error => {
      console.error('Error processing file', error);
      res.status(500).send('Error processing file');
    });
});

module.exports = router;