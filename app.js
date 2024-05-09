const http = require("http");

const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const errorController = require('./controllers/error')

const adminRoutes = require("./routes/admin");
const shoproutes = require("./routes/shop");

const bodyparser = require("body-parser");

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyparser.urlencoded({ extended: false }));

//for path 
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

app.use("/admin", adminRoutes);
app.use(shoproutes);
app.use(errorController.get404);


app.listen(3000);
