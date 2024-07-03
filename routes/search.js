const express = require('express');

const searchController = require('../controllers/search');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/search', isAuth,searchController.getSearch);

module.exports = router;