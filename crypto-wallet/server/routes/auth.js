const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Email already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            assets: [
                { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', amount: 0.05, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
                { id: 'ethereum', symbol: 'eth', name: 'Ethereum', amount: 0.5, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' }
            ] // Give some default assets for demo
        });

        const savedUser = await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Check password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ message: "Invalid password" });

        // Create token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'secretKey', { expiresIn: '1h' });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                walletBalance: user.walletBalance,
                assets: user.assets
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
