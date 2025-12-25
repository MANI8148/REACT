const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (login, register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

// Rate limiter for 2FA verification
const twoFALimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 attempts per window
    message: 'Too many 2FA attempts, please try again after 5 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for transaction routes
const transactionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 transactions per minute
    message: 'Too many transaction requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for PIN verification
const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many PIN attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authLimiter,
    twoFALimiter,
    transactionLimiter,
    pinLimiter,
    apiLimiter
};
