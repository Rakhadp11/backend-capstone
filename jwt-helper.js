const jwt = require('jsonwebtoken');
const config = require('./config');

function generateAccessToken(user) {
    return jwt.sign(user, config.jwtSecret, { expiresIn: '15m' }); // Adjust expiration time as needed
}

function generateRefreshToken(user) {
    return jwt.sign(user, config.refreshTokenSecret);
}

module.exports = { generateAccessToken, generateRefreshToken };
