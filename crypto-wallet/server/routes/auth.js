const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { ethers } = require('ethers');
const { validate } = require('../middleware/validation');
const { authLimiter, twoFALimiter } = require('../middleware/rateLimiter');

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

// REGISTER
router.post('/register', validate('register'), authLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.validatedBody;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Email already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique Ethereum wallet address
        const wallet = ethers.Wallet.createRandom();
        const walletAddress = wallet.address;

        // Generate TOTP secret for 2FA
        const totpSecret = speakeasy.generateSecret({
            name: `CryptoWallet (${email})`,
            length: 32
        });

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            walletBalance: 1000, // Starting USD balance
            walletAddress: walletAddress,
            totpSecret: totpSecret.base32,
            twoFactorEnabled: false, // User needs to complete setup
            assets: []
        });

        // DEMO FEATURE: Assign $10,000 worth of random assets from API
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

        res.status(201).json({
            message: "User created successfully",
            walletAddress: walletAddress
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
router.post('/login', validate('login'), authLimiter, async (req, res) => {
    try {
        const { email, password } = req.validatedBody;

        // Check user
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`Login failed: User with email ${email} not found`);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            console.log(`Login failed: Invalid password for email ${email}`);
            return res.status(400).json({ message: "Invalid credentials" });
        }

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
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            requires2FA: user.twoFactorEnabled,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                walletBalance: user.walletBalance,
                walletAddress: user.walletAddress,
                assets: user.assets,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Setup 2FA - Get QR Code
router.get('/2fa/setup', verify, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.totpSecret) {
            // Generate new secret if not exists
            const secret = speakeasy.generateSecret({
                name: `CryptoWallet (${user.email})`,
                length: 32
            });
            user.totpSecret = secret.base32;
            await user.save();
        }

        // Generate QR code
        const otpauthUrl = speakeasy.otpauthURL({
            secret: user.totpSecret,
            label: user.email,
            issuer: 'CryptoWallet',
            encoding: 'base32'
        });

        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        res.json({
            secret: user.totpSecret,
            qrCode: qrCodeDataUrl,
            enabled: user.twoFactorEnabled
        });
    } catch (err) {
        console.error('2FA setup error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verify and Enable 2FA
router.post('/2fa/verify', verify, validate('verify2FA'), twoFALimiter, async (req, res) => {
    try {
        const { token } = req.validatedBody;
        const user = await User.findById(req.user._id);

        if (!user || !user.totpSecret) {
            return res.status(400).json({ message: '2FA not set up' });
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: user.totpSecret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps before/after for clock drift
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid 2FA code' });
        }

        // Enable 2FA
        user.twoFactorEnabled = true;
        await user.save();

        res.json({ message: '2FA enabled successfully', verified: true });
    } catch (err) {
        console.error('2FA verification error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Disable 2FA
router.post('/2fa/disable', verify, validate('verify2FA'), twoFALimiter, async (req, res) => {
    try {
        const { token } = req.validatedBody;
        const user = await User.findById(req.user._id);

        if (!user || !user.totpSecret) {
            return res.status(400).json({ message: '2FA not set up' });
        }

        // Verify the token before disabling
        const verified = speakeasy.totp.verify({
            secret: user.totpSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid 2FA code' });
        }

        // Disable 2FA
        user.twoFactorEnabled = false;
        await user.save();

        res.json({ message: '2FA disabled successfully' });
    } catch (err) {
        console.error('2FA disable error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
