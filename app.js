const http = require("http");

const express = require("express");

const adminroutes = require("./routes/admin");

const shoproutes = require("./routes/shop");

const bodyparser = require("body-parser");

const app = express();

app.use(bodyparser.urlencoded({ extended: false }));

app.use('/admin',adminroutes);

app.use(shoproutes);

app.use((req, res, next) => {
  res.status(404).send("<hq>page not found</h1>");
});

app.listen(3000);
