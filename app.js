const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI = "mongodb+srv://dhruvsavani610:OnpKEyb6R4liBAfY@shop.js2sfd0.mongodb.net/shop?retryWrites=true&w=majority&appName=shop";

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set("view engine", "ejs");
app.set("views", "views");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, "images")));

// Session middleware
app.use(session({
  secret: "my secret",
  resave: false,
  saveUninitialized: false,
  store: store,
}));

// CSRF middleware
app.use(csrfProtection);

// Flash messages middleware
app.use(flash());

// Custom middleware to set local variables
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  // console.log("CSRF Token:", res.locals.csrfToken);
  next();
});

// Fetch user middleware
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// Routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const searchRoutes = require("./routes/search");

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(searchRoutes);

// Error handling middleware for 500 errors
app.use("/500", errorController.get500);

// Catch-all middleware for 404 errors
app.use(errorController.get404);

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error(error); // Log the error for debugging
  res.status(500).render("500", {
    pageTitle: "Internal Server Error",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

// Start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    app.listen(3000);
    console.log("Server started on port 3000");
  })
  .catch((err) => {
    console.log(err);
  });
