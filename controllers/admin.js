const mongoose = require("mongoose");
const fileHelper = require("../util/file");
const { validationResult } = require("express-validator");
const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const ITEMS_PER_PAGE = 3;

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const colour = req.body.colour;
  const category = req.body.category;
  const subCategory = req.body.subCategory;
  const quantity = req.body.quantity;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not an image.",
      validationErrors: [],
    });
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl: image.path, // Fixed typo
        price: price,
        category: category,
        subCategory: subCategory,
        colour: colour,
        quantity: quantity,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    category: category,
    subCategory: subCategory,
    colour: colour,
    quantity: quantity,
    userId: req.user,
    isDeleted: false,
  });
  product
    .save()
    .then((result) => {
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedColour = req.body.colour;
  const updatedQuantity = req.body.quantity;
  const updatedCategory = req.body.category;
  const updatedSubCategory = req.body.subCategory;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        colour: updatedColour,
        quantity: updatedQuantity,
        category: updatedCategory,
        subCategory: updatedSubCategory,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        const error = new Error("Product not found.");
        error.statusCode = 404;
        throw error;
      }
      if (product.userId.toString() !== req.user._id.toString()) {
        const error = new Error("Unauthorized access.");
        error.statusCode = 403;
        throw error;
      }

      console.log("Found Product:", product);

      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.colour = updatedColour;
      product.quantity = updatedQuantity;
      product.category = updatedCategory;
      product.subCategory = updatedSubCategory;

      if (image) {
        console.log("New Image Uploaded:", image.path);
        // Replace with your fileHelper logic to delete old image
        // fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }

      console.log("Product going to be saved:", product);

      return product.save();
    })
    .then((result) => {
      console.log("UPDATED PRODUCT:", result);
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.error("Error updating product:", err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find({ userId: req.user._id, isDeleted: false })
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({ userId: req.user._id, isDeleted: false }) // Filter out deleted products and users
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      // console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// exports.postDeleteProduct = (req, res, next) => {
//   const prodId = req.body.productId;
//   Product.findById(prodId)
//     .then((product) => {
//       if (!product) {
//         return next(new Error("Product not found"));
//       }
//       fileHelper.deleteFile(product.imageUrl);
//       return Product.updateOne({ _id: prodId, userId: req.user._id });
//     })
//     .then(() => {
//       console.log("Deleted Product");
//       res.redirect("/admin/products");
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

// exports.postDeleteProduct = (req, res, next) => {
//   const prodId = req.body.productId;
//   Product.findById(prodId)
//     .then((product) => {
//       if (!product) {
//         return next(new Error("Product not found"));
//       }
//       fileHelper.deleteFile(product.imageUrl);
//       return Product.updateOne(
//         { _id: prodId, userId: req.user._id },
//         { $set: { isDeleted: true } }
//       );
//     })
//     .then(() => {
//       console.log("Marked Product as Deleted");
//       res.redirect("/admin/products");
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found"));
      }
      // fileHelper.deleteFile(product.imageUrl); This is used to delete images from the local storage, so when a product is deleted, the image is not displayed.
      return Product.updateOne(
        { _id: prodId, userId: req.user._id },
        { $set: { isDeleted: true } }
      );
    })
    .then(() => {
      console.log("Marked Product as Deleted");
      res.status(200).json({ message: "Success" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Deleting product is failed!" });
    });
};

exports.getAccount = (req, res, next) => {
  let userData;
  User.findById(req.user._id)
    .then((user) => {
      userData = user;
      return Order.find({ "user.userId": req.user._id });
    })
    .then((orders) => {
      res.render("admin/account", {
        email: userData.email,
        orders: orders,
        pageTitle: "Admin Account",
        path: "/admin/account",
      });
    });
};
