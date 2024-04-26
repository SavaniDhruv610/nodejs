const http = require("http");

const express = require("express");

const adminroutes = require("./routes/admin");

const shoproutes = require("./routes/shop");

const bodyparser = require("body-parser");

const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname,'public')));

app.use(bodyparser.urlencoded({ extended: false }));

app.use('/admin',adminroutes);

app.use(shoproutes);

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname,'views','404.html'))
});

app.listen(3000);
