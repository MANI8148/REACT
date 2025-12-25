const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, 'Asset ID is required']
    },
    symbol: {
        type: String,
        required: [true, 'Asset symbol is required'],
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'Asset name is required']
    },
    amount: {
        type: Number,
        required: [true, 'Asset amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    image: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: [0, 'Balance cannot be negative']
    },
    assets: {
        type: [AssetSchema],
        default: []
    },
    // Cold storage assets
    coldStorageAssets: {
        type: [AssetSchema],
        default: []
    },
    // Unique Ethereum wallet address
    walletAddress: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Invalid Ethereum address format'
        }
    },
    // Hashed PIN for transaction signing
    pin: {
        type: String,
        default: null
    },
    // TOTP secret for 2FA
    totpSecret: {
        type: String,
        default: null
    },
    // 2FA enabled flag
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 });
UserSchema.index({ walletAddress: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
