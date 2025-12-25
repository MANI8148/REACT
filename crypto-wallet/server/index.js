const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const pinRoutes = require('./routes/pin');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Apply general API rate limiter to all routes
app.use('/api/', apiLimiter);

// Database Connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
}

console.log('Connecting to MongoDB with URI:', mongoURI);
mongoose.connect(mongoURI)
    .then(() => console.log('Successfully connected to MongoDB Cluster'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/pin', pinRoutes);

app.get('/', (req, res) => {
    res.send('Crypto Wallet API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
