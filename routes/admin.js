const path = require("path");

const express = require("express");

const productsController = require('../controllers/product')
const router = express.Router();

// const products = [];


// /admin/add-product => GET
router.get("/add-product",productsController.getAddProduct );

// /admin/add-product => POST
router.post("/add-product",productsController.postAllProduct);

module.exports = router;
