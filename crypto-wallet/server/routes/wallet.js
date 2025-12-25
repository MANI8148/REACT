const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { validate } = require('../middleware/validation');
const { transactionLimiter } = require('../middleware/rateLimiter');

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

// GET WALLET DATA
router.get('/data', verify, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            walletBalance: user.walletBalance,
            walletAddress: user.walletAddress,
            assets: user.assets,
            coldStorageAssets: user.coldStorageAssets || []
        });
    } catch (err) {
        console.error('Get wallet data error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET TRANSACTION HISTORY
router.get('/history', verify, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(100); // Limit to last 100 transactions
        res.json(transactions);
    } catch (err) {
        console.error('Get transaction history error:', err);
        res.status(500).json({ error: err.message });
    }
});

// TRANSACTION (BUY, SELL, SEND, RECEIVE)
router.post('/transaction', verify, validate('transaction'), transactionLimiter, async (req, res) => {
    try {
        const { type, assetId, amount, totalValue, symbol, name, image, recipientAddress } = req.validatedBody;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate recipient address for send transactions
        if (type === 'send') {
            if (!recipientAddress) {
                return res.status(400).json({ message: 'Recipient address is required for send transactions' });
            }
            if (!ethers.isAddress(recipientAddress)) {
                return res.status(400).json({ message: 'Invalid Ethereum address' });
            }
            // Prevent sending to self
            if (recipientAddress.toLowerCase() === user.walletAddress.toLowerCase()) {
                return res.status(400).json({ message: 'Cannot send to your own address' });
            }
        }

        if (type === 'buy') {
            if (user.walletBalance < totalValue) {
                return res.status(400).json({ message: "Insufficient USD balance" });
            }
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

        // Record Transaction
        const newTransaction = new Transaction({
            userId: user._id,
            type,
            assetId,
            symbol: symbol || 'N/A',
            amount,
            totalValue,
            recipientAddress: recipientAddress || null,
            status: 'completed'
        });
        await newTransaction.save();

        const savedUser = await user.save();
        res.json({
            walletBalance: savedUser.walletBalance,
            assets: savedUser.assets,
            transaction: newTransaction
        });
    } catch (err) {
        console.error('Transaction error:', err);
        res.status(500).json({ error: err.message });
    }
});

// TRANSFER (HOT TO COLD STORAGE AND VICE VERSA)
router.post('/transfer', verify, validate('transfer'), transactionLimiter, async (req, res) => {
    try {
        const { assetId, amount, direction } = req.validatedBody;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (direction === 'hot-to-cold') {
            // Transfer from hot wallet to cold storage
            const assetIndex = user.assets.findIndex(a => a.id === assetId);
            if (assetIndex === -1 || user.assets[assetIndex].amount < amount) {
                return res.status(400).json({ message: "Insufficient asset balance in hot wallet" });
            }

            // Reduce from hot wallet
            user.assets[assetIndex].amount -= amount;
            const asset = user.assets[assetIndex];

            // Add to cold storage
            const coldIndex = user.coldStorageAssets.findIndex(a => a.id === assetId);
            if (coldIndex > -1) {
                user.coldStorageAssets[coldIndex].amount += amount;
            } else {
                user.coldStorageAssets.push({
                    id: asset.id,
                    symbol: asset.symbol,
                    name: asset.name,
                    amount: amount,
                    image: asset.image
                });
            }

            // Remove from hot wallet if amount is 0
            if (user.assets[assetIndex].amount === 0) {
                user.assets.splice(assetIndex, 1);
            }

        } else if (direction === 'cold-to-hot') {
            // Transfer from cold storage to hot wallet
            const coldIndex = user.coldStorageAssets.findIndex(a => a.id === assetId);
            if (coldIndex === -1 || user.coldStorageAssets[coldIndex].amount < amount) {
                return res.status(400).json({ message: "Insufficient asset balance in cold storage" });
            }

            // Reduce from cold storage
            user.coldStorageAssets[coldIndex].amount -= amount;
            const asset = user.coldStorageAssets[coldIndex];

            // Add to hot wallet
            const hotIndex = user.assets.findIndex(a => a.id === assetId);
            if (hotIndex > -1) {
                user.assets[hotIndex].amount += amount;
            } else {
                user.assets.push({
                    id: asset.id,
                    symbol: asset.symbol,
                    name: asset.name,
                    amount: amount,
                    image: asset.image
                });
            }

            // Remove from cold storage if amount is 0
            if (user.coldStorageAssets[coldIndex].amount === 0) {
                user.coldStorageAssets.splice(coldIndex, 1);
            }
        }

        // Record transfer transaction
        const newTransaction = new Transaction({
            userId: user._id,
            type: 'transfer',
            assetId,
            symbol: user.assets.find(a => a.id === assetId)?.symbol ||
                user.coldStorageAssets.find(a => a.id === assetId)?.symbol || 'N/A',
            amount,
            totalValue: 0,
            status: 'completed'
        });
        await newTransaction.save();

        await user.save();
        res.json({
            walletBalance: user.walletBalance,
            assets: user.assets,
            coldStorageAssets: user.coldStorageAssets,
            transaction: newTransaction
        });
    } catch (err) {
        console.error('Transfer error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
