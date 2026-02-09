const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    logoutUser,
    getUserProfile,
    getUsers,
    approveUser,
    getPendingUsers,
    searchUsers,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router
    .route('/search')
    .get(protect, searchUsers);
router
    .route('/profile')
    .get(protect, getUserProfile);
router
    .route('/')
    .get(protect, admin, getUsers);
router
    .route('/:id/approve')
    .put(protect, admin, approveUser);

router
    .route('/pending')
    .get(protect, admin, getPendingUsers);


module.exports = router;
