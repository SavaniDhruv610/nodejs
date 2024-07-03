const Product = require("../models/product");
const ITEMS_PER_PAGE_SEARCH = 50;



exports.getSearch = (req, res, next) => {
    const query = req.query.query;
    const page = +req.query.page || 1; // Current page number, default to 1 if not provided
    // Perform case-insensitive search by description and filter out deleted products
    Product.find({ description: new RegExp(query, "i"), isDeleted: false })
      .countDocuments()
      .then((totalItems) => {
        return Product.find({
          description: new RegExp(query, "i"),
          isDeleted: false
        })
          .skip((page - 1) * ITEMS_PER_PAGE_SEARCH)
          .limit(ITEMS_PER_PAGE_SEARCH)
          .then((products) => {
            res.render("shop/search", {
              products: products,
              pageTitle: "Search Results",
              path: "/search",
              isAuthenticated: req.session.isLoggedIn,
              currentPage: page,
              hasNextPage: ITEMS_PER_PAGE_SEARCH * page < totalItems,
              hasPreviousPage: page > 1,
              nextPage: page + 1,
              previousPage: page - 1,
              lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE_SEARCH),
              query: query // Send back the query to pre-fill the search field
            });
          });
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  };
  