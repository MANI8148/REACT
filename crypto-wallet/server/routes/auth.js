const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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
            walletBalance: 1000, // Starting USD balance
            assets: []
        });

        // Assign $10,000 worth of random assets from API
        try {
            const coinResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
                params: {
                    vs_currency: 'usd',
                    order: 'market_cap_desc',
                    per_page: 50,
                    page: 1,
                    sparkline: false
                }
            });

            const topCoins = coinResponse.data;
            const selectedCoins = [];
            for (let i = 0; i < 3; i++) {
                const randomIdx = Math.floor(Math.random() * topCoins.length);
                selectedCoins.push(topCoins.splice(randomIdx, 1)[0]);
            }

            const totalToAllocate = 10000;
            const allocationPerCoin = totalToAllocate / selectedCoins.length;

            newUser.assets = selectedCoins.map(coin => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                amount: allocationPerCoin / coin.current_price,
                image: coin.image
            }));
        } catch (apiErr) {
            console.error("Failed to fetch random assets:", apiErr.message);
            // Fallback to static assets if API fails
            newUser.assets = [
                { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', amount: 10000 / 60000, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' }
            ];
        }

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

        // For demo purposes: if user has no assets, give them $10,000 random assets
        if (!user.assets || user.assets.length === 0) {
            try {
                const coinResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
                    params: {
                        vs_currency: 'usd',
                        order: 'market_cap_desc',
                        per_page: 50,
                        page: 1,
                        sparkline: false
                    }
                });

                const topCoins = coinResponse.data;
                const selectedCoins = [];
                for (let i = 0; i < 3; i++) {
                    const randomIdx = Math.floor(Math.random() * topCoins.length);
                    selectedCoins.push(topCoins.splice(randomIdx, 1)[0]);
                }

                const totalToAllocate = 10000;
                const allocationPerCoin = totalToAllocate / selectedCoins.length;

                user.assets = selectedCoins.map(coin => ({
                    id: coin.id,
                    symbol: coin.symbol,
                    name: coin.name,
                    amount: allocationPerCoin / coin.current_price,
                    image: coin.image
                }));
                await user.save();
            } catch (apiErr) {
                console.error("Failed to fetch random assets on login:", apiErr.message);
            }
        }

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
