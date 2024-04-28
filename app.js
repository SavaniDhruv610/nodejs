const http = require("http");

const express = require("express");
const app = express();

app.set("view engine", "pug");
app.set('views','views');


const adminData = require("./routes/admin");

const shoproutes = require("./routes/shop");

const bodyparser = require("body-parser");


const path = require("path");


app.use(express.static(path.join(__dirname, "public")));

app.use(bodyparser.urlencoded({ extended: false }));

app.use("/admin", adminData.routes);

app.use(shoproutes);

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

app.listen(3000);
