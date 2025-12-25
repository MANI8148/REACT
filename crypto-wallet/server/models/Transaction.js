const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: {
            values: ['buy', 'sell', 'send', 'receive', 'transfer'],
            message: '{VALUE} is not a valid transaction type'
        },
        index: true
    },
    assetId: {
        type: String,
        required: [true, 'Asset ID is required']
    },
    symbol: {
        type: String,
        required: [true, 'Symbol is required'],
        uppercase: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive']
    },
    totalValue: {
        type: Number,
        default: 0,
        min: [0, 'Total value cannot be negative']
    },
    recipientAddress: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Invalid Ethereum address format'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
TransactionSchema.index({ userId: 1, timestamp: -1 });
TransactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
