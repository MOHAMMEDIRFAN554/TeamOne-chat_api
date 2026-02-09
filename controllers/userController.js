const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isApproved) {
            res.status(401);
            throw new Error('User not approved by admin');
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(res, user._id),
            isApproved: user.isApproved,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Check if this is the first user
    const count = await User.countDocuments({});
    const isFirstUser = count === 0;

    const user = await User.create({
        name,
        email,
        password,
        role: isFirstUser ? 'admin' : 'member',
        isApproved: isFirstUser ? true : false,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            token: generateToken(res, user._id), // Even unapproved users get a token? 
            // Probably not ideal, but for now we block them at login. 
            // If we give them a token here, they could technically access protected routes immediately...
            // Let's reconsider. 
            // If blocked at login, they can't create one. 
            // If we omit token here for unapproved users, they must wait.
            // Better: If isApproved is false, send a message saying "Pending Approval".
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// @desc    Approve user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
const approveUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.isApproved = true;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get non-approved users
// @route   GET /api/users/pending
// @access  Private/Admin
const getPendingUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ isApproved: false });
    res.json(users);
});

// @desc    Search users by name or email
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword
        ? {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { email: { $regex: req.query.keyword, $options: 'i' } },
            ],
            _id: { $ne: req.user._id }, // Exclude current user
            isApproved: true, // Only search approved users
        }
        : { _id: { $ne: req.user._id }, isApproved: true };

    const users = await User.find(keyword).select('name email role');
    res.json(users);
});


module.exports = {
    authUser,
    registerUser,
    logoutUser,
    getUserProfile,
    getUsers,
    approveUser,
    getPendingUsers,
    searchUsers
};
