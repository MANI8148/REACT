const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    id: { type: String, required: true }, // e.g., 'bitcoin'
    symbol: { type: String, required: true }, // e.g., 'btc'
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
    image: { type: String }
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletBalance: { type: Number, default: 100000 }, // Default mock USD balance
    assets: [AssetSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
