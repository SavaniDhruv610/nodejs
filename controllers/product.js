const products = [];

exports.getAddProduct = (req, res, next) => {
  res.render("add-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    fromsCSS: true,
    productCSS: false,
    activeADDProduce: true,
  });
};

exports.postAllProduct = (req, res, next) => {
  products.push({
    title: req.body.title,
  });
  res.redirect("/");
};

exports.getProducts = (req, res, next) => {
  res.render("shop", {
    prods: products,
    pageTitle: "Shop",
    path: "/",
    hasProduct: products.length > 0,
    activeShop: true,
    productCSS: true,
  });
};
