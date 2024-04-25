
const express = require('express');
const routes  = express.Router();



routes.get("/", (req, res, next) => {
    //   console.log("another middle ware");
    res.send("<h1>hello from express</h1>");
    //this middlewear always run first becaus it match users first
    //therefor we call this middleware after the user middleware
  });


  module.exports  = routes;