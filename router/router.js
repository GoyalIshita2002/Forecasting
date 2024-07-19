const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const authenticateToken = require('../middleware/authenticateToken.js');
const { processCSV } = require('../services/csvprocessor.js');

const { CreateUser, GetUser, GetUserById, SigninUser } = require('../controller/user/user.js');
const {GetProduct,GetProductById } = require('../controller/product/product.js');

router.post('/users', CreateUser);
router.post('/signin', SigninUser);
router.get('/users', GetUser);

router.use(authenticateToken);
router.get('/user', GetUserById);
router.get('/products', GetProduct);
router.get('/product/:id', GetProductById);



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
