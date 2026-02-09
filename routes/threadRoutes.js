const express = require('express');
const router = express.Router();
const {
    createThread,
    getThreads,
    getThreadById,
    updateThread,
} = require('../controllers/threadController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createThread)
    .get(protect, getThreads);

router.route('/:id')
    .get(protect, getThreadById)
    .put(protect, updateThread);

module.exports = router;
