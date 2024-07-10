const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51PVVgIHSPjrJ3mNHtKcMw1WcMWPrQbLkvPWXgsslDfLdLb1qI2ROSY88zGH1yE0XlBNVbGiWqNTSC0PJcK45IBxb00PGTlcXtM"
);
const PDFDocument = require("pdfkit");
const Product = require("../models/product");
const Order = require("../models/order");
const mongoose = require('mongoose');
const ITEMS_PER_PAGE = 10;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find({ isDeleted: false }) // Filter out deleted products
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({ isDeleted: false }) // Filter out deleted products
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
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

// exports.getProduct = (req, res, next) => {
//   const prodId = req.params.productId;
//   Product.findById(prodId)
//     .then((product) => {
//       res.render("shop/product-detail", {
//         product: product,
//         pageTitle: product.title,
//         path: "/products",
//       });
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  
  // Find the product by its ID
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        const error = new Error('Product not found');
        error.httpStatusCode = 404;
        return next(error);
      }
      
      // Render the product-detail view with the found product
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      // Handle any errors that occur during product retrieval
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1; // Parse the page number from query parameters or default to 1
  let totalItems;

  Product.find({ isDeleted: false })
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({ isDeleted: false })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      // Render the 'shop/index' template with the following data:
      res.render("shop/index", {
        prods: products, // Pass the fetched products array to the template
        pageTitle: "Shop", // Set the page title for the index page
        path: "/", // Set the current path for navigation or reference
        currentPage: page, // Pass the current page number to manage pagination
        hasNextPage: ITEMS_PER_PAGE * page < totalItems, // Calculate if there is a next page
        hasPreviousPage: page > 1, // Check if there is a previous page
        nextPage: page + 1, // Calculate the next page number
        previousPage: page - 1, // Calculate the previous page number
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE), // Calculate the last page based on total items and items per page
        isAuthenticated: req.session.isLoggedIn, // Pass whether the user is authenticated or not
        user: req.user, // Pass the currently logged-in user's details to the template
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = async (req, res, next) => {
  await req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        throw new Error("Product not found");
      }
      return req.user.addToCart(product); // Assuming addToCart method handles adding to user's cart
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      // console.log(user.cart.items);
      products = user.cart.items;
      products.forEach((p) => {
        total += +p.quantity * +p.productId.price;
      });
      return stripe.checkout.sessions.create({
        line_items: products.map((p) => {
          return {
            price_data: {
              currency: "inr",
              unit_amount: parseInt(Math.ceil(p.productId.price * 100)),
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              },
            },
            quantity: p.quantity,
          };
        }),
        mode: "payment",
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success", // => http://localhost:3000,
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        pageTitle: "Checkout",
        path: "/checkout",
        products: products,
        totalSum: total.toFixed(2),
        sessionId: session.id,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = async (req, res, next) => {
  try {
    // Populate user's cart items with product details
    await req.user.populate("cart.items.productId");
    // Map cart items to order products
    const products = req.user.cart.items.map((item) => ({
      product: { ...item.productId._doc }, // Use _doc to get plain object if needed
      quantity: item.quantity,
    }));

    // Create a new order instance
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user._id,
      },
      products: products,
    });

    // Save the order to database
    await order.save();

    // Update product quantities in the database
    for (const item of products) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        throw new Error("Product not found");
      }
      product.quantity -= item.quantity;
      await product.save();
    }

    // Clear the user's cart after successful order
    await req.user.clearCart();

    // Redirect to orders page
    res.redirect("/orders");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
// exports.postOrder = async (req, res, next) => {
//   await req.user
//     .populate("cart.items.productId")
//     .then((user) => {
//       const products = user.cart.items.map((i) => {
//         return { quantity: i.quantity, product: { ...i.productId._doc } };
//       });
//       const order = new Order({
//         user: {
//           email: req.user.email,
//           userId: req.user,
//         },
//         products: products,
//       });
//       return order.save();
//     })
//     .then((result) => {
//       return req.user.clearCart();
//     })
//     .then(() => {
//       res.redirect("/orders");
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No Order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath)); // Save to file
      pdfDoc.pipe(res); // Stream to response

      // Header and Invoice details on the same line
      pdfDoc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("Crayon Solutions", 50, 50);
      pdfDoc.font("Helvetica").fontSize(12).text("+91 9879090909", 50, 70);

      pdfDoc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("INVOICE", 400, 50, { align: "right" });
      pdfDoc
        .font("Helvetica")
        .fontSize(12)
        .text(`Invoice No. ${orderId}`, 200, 70, { align: "right" });
      pdfDoc.text(`16 June 2025`, 400, 90, { align: "right" });

      pdfDoc.moveDown(2);
      // Billing details
      pdfDoc.text("BILLED TO:", 50, pdfDoc.y);
      pdfDoc.text(`${order.user.email}`, 50, pdfDoc.y + 15);

      pdfDoc.moveDown(2);

      // Table header
      pdfDoc.font("Helvetica-Bold").fontSize(12);
      const tableTop = pdfDoc.y;
      pdfDoc.text("Item", 50, tableTop, { width: 150 });
      pdfDoc.text("Quantity", 200, tableTop, { width: 100 });
      pdfDoc.text("Unit Price", 300, tableTop, { width: 100 });
      pdfDoc.text("Total", 400, tableTop, { width: 100 });

      pdfDoc.moveDown();
      pdfDoc.moveTo(50, pdfDoc.y).lineTo(500, pdfDoc.y).stroke(); // Draw line under header
      pdfDoc.moveDown();

      // Table rows
      pdfDoc.font("Helvetica").fontSize(12);
      let totalPrice = 0;
      let yPosition = pdfDoc.y;
      order.products.forEach((prod, i) => {
        const itemTotal = prod.quantity * prod.product.price;
        totalPrice += itemTotal;

        yPosition = pdfDoc.y + 20;
        pdfDoc.text(`${prod.product.title}`, 50, yPosition, { width: 150 });
        pdfDoc.text(`${prod.quantity}`, 200, yPosition, { width: 100 });
        pdfDoc.text(`$${prod.product.price.toFixed(2)}`, 300, yPosition, {
          width: 100,
        });
        pdfDoc.text(`$${itemTotal.toFixed(2)}`, 400, yPosition, { width: 100 });
        pdfDoc.moveDown(1.5);
      });

      pdfDoc
        .moveTo(50, yPosition + 35)
        .lineTo(500, yPosition + 35)
        .stroke(); // Draw line above totals
      pdfDoc.moveDown(1.5);

      // Total price
      const yyPosition = pdfDoc.y; // Store the current y position

      pdfDoc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Subtotal", 300, yyPosition, { width: 100 });
      pdfDoc.text(`$${totalPrice.toFixed(2)}`, 400, yyPosition, { width: 100 });

      pdfDoc.moveDown();
      pdfDoc.fontSize(12).text("Tax (0%)", 300, pdfDoc.y - 13, { width: 100 });
      pdfDoc.text(`$0.00`, 400, yyPosition + 15, { width: 100 }); // Adjust y position for proper alignment

      pdfDoc.moveDown();
      pdfDoc.fontSize(12).text("Total", 300, pdfDoc.y - 13, { width: 100 });
      pdfDoc.text(`$${totalPrice.toFixed(2)}`, 400, yyPosition + 30, {
        width: 100,
      }); // Adjust y position for proper alignment

      pdfDoc.moveDown(2);

      // Thank you note
      pdfDoc.fontSize(12).text("Thank you!", {
        align: "center",
      });

      pdfDoc.end(); // Finish PDF
    })
    .catch((err) => {
      next(err);
    });
};

exports.like = (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.user._id; // Assuming you have user ID in req.user

  Product.findByIdAndUpdate(
    productId,
    { $addToSet: { likes: userId } },
    { new: true }
  )
    .then((updatedProduct) => {
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res
        .status(200)
        .json({ message: "Product liked", product: updatedProduct });
    })
    .catch((err) => {
      console.error("Error liking product:", err);
      res.status(500).json({ message: "Internal server error" });
    });
};


exports.unlike = (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.user._id; // Assuming you have user ID in req.user

  Product.findByIdAndUpdate(
    productId,
    { $pull: { likes: userId } },
    { new: true }
  )
    .then((updatedProduct) => {
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res
        .status(200)
        .json({ message: "Product unliked", product: updatedProduct });
    })
    .catch((err) => {
      console.error("Error unliking product:", err);
      res.status(500).json({ message: "Internal server error" });
    });
};


// exports.postComments = (req, res) => {
//   const commentText = req.body.comment;
//   const userId = req.user._id;
//   const productId = req.params.productId;

//   const comment = {
//     text: commentText,
//     postedBy: userId, // Assuming userId references the user document
//     created: new Date()
//   };

//   Product.findByIdAndUpdate(
//     productId,
//     { $push: { comments: comment } },
//     { new: true }
//   )
//     .populate('comments.postedBy', 'email') // Populate the user's email
//     .then((updatedProduct) => {
//       if (!updatedProduct) {
//         return res.status(404).json({ message: "Product not found" });
//       }
//       const newComment = updatedProduct.comments[updatedProduct.comments.length - 1];
//       res.status(200).json({ comment: newComment });
//     })
//     .catch((err) => {
//       console.error("Error adding comment:", err);
//       res.status(500).json({ message: "Internal server error" });
//     });
// };


// exports.postComments = (req, res) => {
//   const commentText = req.body.comment;
//   const userId = req.user._id; // Assuming userId references the user document
//   const productId = req.params.productId;
//   const email = req.user.email;

//   const comment = {
//     text: commentText,
//     postedBy: userId, // Use userId instead of user email
//     created: new Date(),
//     email:email
//   };

//   // Update the product with the new comment
//   Product.findByIdAndUpdate(
//     productId,
//     { $push: { comments: comment } },
//     { new: true }
//   )
//     .populate('comments.postedBy', 'email') // Populate the user's email in the comments array
//     .then((updatedProduct) => {
//       if (!updatedProduct) {
//         return res.status(404).json({ message: "Product not found" });
//       }
      
//       // Find the newly added comment by matching the text and userId
//       const newComment = updatedProduct.comments.find(c => c.text === comment.text && c.postedBy.equals(comment.postedBy));
      
//       if (!newComment) {
//         return res.status(500).json({ message: "Error finding newly added comment" });
//       }

//       res.status(200).json({ comment: newComment });
//     })
//     .catch((err) => {
//       console.error("Error adding comment:", err);
//       res.status(500).json({ message: "Internal server error" });
//     });
// };



exports.postComments = (req, res) => {
  const commentText = req.body.comment;
  const userId = req.user._id; // Assuming userId references the user document
  const productId = req.params.productId;
  const email = req.user.email;

  const comment = {
    text: commentText,
    postedBy: userId,
    created: new Date(),
    email: email, // Assign the email field
  };

  // Update the product with the new comment
  Product.findByIdAndUpdate(
    productId,
    { $push: { comments: comment } }, // Push the entire comment object to the product's comments array
    { new: true }
  )
    .populate('comments.postedBy', 'email') // Populate the user's email in the comments array
    .then(updatedProduct => {
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Find the newly added comment by matching the text and userId
      const newComment = updatedProduct.comments.find(c => c.text === commentText && c.postedBy.equals(userId));

      if (!newComment) {
        return res.status(500).json({ message: 'Error finding newly added comment' });
      }

      res.status(200).json({ comment: newComment });
    })
    .catch(err => {
      console.error('Error adding comment:', err);
      res.status(500).json({ message: 'Internal server error' });
    });
};
