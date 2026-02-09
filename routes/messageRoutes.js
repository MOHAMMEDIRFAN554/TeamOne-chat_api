const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getMessages,
    updateMessage,
    deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, sendMessage)
    .get(protect, getMessages);

router.route('/:id')
    .put(protect, updateMessage)
    .delete(protect, deleteMessage);

module.exports = router;
