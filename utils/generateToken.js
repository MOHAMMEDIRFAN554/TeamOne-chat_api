const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
    if (!process.env.JWT_SECRET) {
        console.error('[CRITICAL] JWT_SECRET is missing from environment. Authentication will fail.');
    }
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret_not_for_prod', {
        expiresIn: '30d',
    });

    // If we were using cookies, we'd set it here. 
    // For now, we'll just return it in the controller, 
    // but let's keep this utility function standard.
    return token;
};

module.exports = generateToken;
