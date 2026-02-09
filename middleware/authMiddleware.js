const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // Check if user is approved
            // Exception: allow unapproved users to hit specific endpoints if needed? 
            // For now, blocking all protected routes for unapproved users seems safest.
            // But wait, if they need to check status...
            // Maybe we don't block here? 
            // The frontend should handle "Pending" state and not try to fetch data.
            // However, for security, let's block.
            // IF the user is an admin, they are always approved (logic in controller handles creation).
            if (!req.user.isApproved) {
                res.status(403); // Forbidden
                throw new Error('Account pending approval');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, admin };
