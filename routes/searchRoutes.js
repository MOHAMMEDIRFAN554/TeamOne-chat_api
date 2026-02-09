const express = require('express');
const router = express.Router();
const { searchMessages } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, searchMessages);

module.exports = router;
