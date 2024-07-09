const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51PVVgIHSPjrJ3mNHtKcMw1WcMWPrQbLkvPWXgsslDfLdLb1qI2ROSY88zGH1yE0XlBNVbGiWqNTSC0PJcK45IBxb00PGTlcXtM"
);
const PDFDocument = require("pdfkit");
const Product = require("../models/product");
const Order = require("../models/order");
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

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
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
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
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
      return req.user.addToCart(product);
    })
    .then((result) => {
      // console.log(result);
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
  await req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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

exports.like = (req, res) => {
  const prodId = req.body.productId;
  console.log('hit')
  Product.findByIdAndUpdate(
    prodId,
    { $push: req.body.userId },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        message: "post has a like",
      });
    } else {
      res.json(result);
    }
  });
};

exports.unlike = (req, res) => {
  const prodId = req.body.productId;
  Product.findByIdAndUpdate(
    prodId,
    { $pull: req.body.userId },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        message: "post has a like",
      });
    } else {
      res.json(result);
    }
  });
};

