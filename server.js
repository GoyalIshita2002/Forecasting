const express = require('express')
const { connectdb } = require('./connection/connection.js');
const routes = require('./router/router.js');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express()
const port = 3000

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(routes); 

app.use((err, req, res, next) => {
    console.error("An error occurred:", err);
    return res.status(500).json({ message: "Internal server error" });
});

connectdb().then(()=>{
  app.listen(port, () => {
      console.log(`Server is running at port number ${port}`);
  });
}).catch(err=>{
  console.error("Connection failure ",err);
})