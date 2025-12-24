const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verify = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

// GET WALLET DATA
router.get('/data', verify, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            walletBalance: user.walletBalance,
            assets: user.assets
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TRANSACTION (BUY, SELL, SEND, RECEIVE)
router.post('/transaction', verify, async (req, res) => {
    try {
        const { type, assetId, amount, totalValue, symbol, name, image } = req.body;
        const user = await User.findById(req.user._id);

        if (type === 'buy') {
            if (user.walletBalance < totalValue) return res.status(400).json({ message: "Insufficient USD balance" });
            user.walletBalance -= totalValue;

            const assetIndex = user.assets.findIndex(a => a.id === assetId);
            if (assetIndex > -1) {
                user.assets[assetIndex].amount += amount;
            } else {
                user.assets.push({ id: assetId, symbol, name, amount, image });
            }
        } else if (type === 'sell') {
            const assetIndex = user.assets.findIndex(a => a.id === assetId);
            if (assetIndex === -1 || user.assets[assetIndex].amount < amount) {
                return res.status(400).json({ message: "Insufficient asset balance" });
            }
            user.assets[assetIndex].amount -= amount;
            user.walletBalance += totalValue;

            if (user.assets[assetIndex].amount === 0) {
                user.assets.splice(assetIndex, 1);
            }
        } else if (type === 'send') {
            const assetIndex = user.assets.findIndex(a => a.id === assetId);
            if (assetIndex === -1 || user.assets[assetIndex].amount < amount) {
                return res.status(400).json({ message: "Insufficient asset balance" });
            }
            user.assets[assetIndex].amount -= amount;

            if (user.assets[assetIndex].amount === 0) {
                user.assets.splice(assetIndex, 1);
            }
        } else if (type === 'receive') {
            const assetIndex = user.assets.findIndex(a => a.id === assetId);
            if (assetIndex > -1) {
                user.assets[assetIndex].amount += amount;
            } else {
                user.assets.push({ id: assetId, symbol, name, amount, image });
            }
        }

        const savedUser = await user.save();
        res.json({
            walletBalance: savedUser.walletBalance,
            assets: savedUser.assets
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TRANSFER (HOT TO COLD AND VICE VERSA)
router.post('/transfer', verify, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            walletBalance: user.walletBalance,
            assets: user.assets
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
