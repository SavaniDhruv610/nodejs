const path = require("path");

const express = require("express");

const productsController = require("../controllers/product");

const router = express.Router();

router.get("/",productsController.getProducts);

module.exports = router;
 