const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    // If we were using cookies, we'd set it here. 
    // For now, we'll just return it in the controller, 
    // but let's keep this utility function standard.
    return token;
};

module.exports = generateToken;
