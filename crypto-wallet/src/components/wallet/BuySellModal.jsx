import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Wallet } from 'lucide-react';
import './BuySellModal.css';

const BuySellModal = ({ isOpen, onClose, type, asset, onConfirm, currentPrice }) => {
    const [amount, setAmount] = useState('');
    const [estimatedValue, setEstimatedValue] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setEstimatedValue(0);
        }
    }, [isOpen]);

    const handleAmountChange = (e) => {
        const val = e.target.value;
        setAmount(val);
        setEstimatedValue(parseFloat(val || 0) * currentPrice);
    };

    if (!isOpen) return null;

    // Simplified list of coins for the dropdown - in a real app this comes from API/Context
    const availableCoins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        { id: 'solana', name: 'Solana', symbol: 'SOL' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
        { id: 'ripple', name: 'XRP', symbol: 'XRP' },
        { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <div className={`icon-circle ${type}`}>
                        <Wallet size={24} />
                    </div>
                    <h2>{type === 'buy' ? 'Buy Asset' : 'Sell Asset'}</h2>
                </div>

                <div className="form-group">
                    <label>Select Asset</label>
                    <select
                        className="asset-select"
                        value={asset?.id || 'bitcoin'}
                        onChange={(e) => {
                            // This is a simplified handling where we just log or would ideally call a parent handler
                            console.log("Selected asset:", e.target.value);
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                            marginBottom: '1rem'
                        }}
                    >
                        {availableCoins.map(coin => (
                            <option key={coin.id} value={coin.id}>
                                {coin.name} ({coin.symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="asset-preview">
                    <div className={`coin-icon ${asset?.symbol?.toLowerCase()}`}>{asset?.symbol?.[0]}</div>
                    <div className="asset-info">
                        <h3>{asset?.name}</h3>
                        <span>Current Price: ${currentPrice.toLocaleString()}</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Amount ({asset?.symbol})</label>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        min="0"
                    />
                </div>

                <div className="summary-row">
                    <span>Estimated Value</span>
                    <span className="value">${estimatedValue.toLocaleString()}</span>
                </div>

                <button
                    className={`confirm-btn ${type}`}
                    onClick={() => onConfirm(parseFloat(amount), type)}
                    disabled={!amount || parseFloat(amount) <= 0}
                >
                    {type === 'buy' ? 'Buy Now' : 'Sell Now'} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default BuySellModal;
