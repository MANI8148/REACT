const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validate } = require('../middleware/validation');
const { pinLimiter } = require('../middleware/rateLimiter');

// Middleware to verify token
const verify = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Setup PIN for transaction signing
router.post('/setup', verify, validate('setupPin'), pinLimiter, async (req, res) => {
    try {
        const { pin } = req.validatedBody;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the PIN
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        user.pin = hashedPin;
        await user.save();

        res.json({ message: 'PIN setup successfully' });
    } catch (err) {
        console.error('PIN setup error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verify PIN for transactions
router.post('/verify', verify, validate('verifyPin'), pinLimiter, async (req, res) => {
    try {
        const { pin } = req.validatedBody;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.pin) {
            return res.status(400).json({ message: 'PIN not set up. Please set up your PIN first.' });
        }

        // Verify PIN
        const validPin = await bcrypt.compare(pin, user.pin);

        if (!validPin) {
            return res.status(400).json({ message: 'Invalid PIN' });
        }

        res.json({ message: 'PIN verified successfully', valid: true });
    } catch (err) {
        console.error('PIN verification error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check if PIN is set up
router.get('/status', verify, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('pin');
        res.json({ hasPin: !!user.pin });
    } catch (err) {
        console.error('PIN status check error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
